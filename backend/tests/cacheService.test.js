// backend/tests/cacheService.test.js
// cacheService a un état de module (client/isReady) posé une seule fois
// par connectCache() : jest.resetModules() + un nouveau require() entre
// chaque bloc garantissent un état neuf, indépendant du reste de la suite.

describe("cacheService - mode dégradé (Redis jamais connecté)", () => {
  let cacheService;

  beforeEach(() => {
    jest.resetModules();
    cacheService = require("../services/cacheService");
  });

  // C'est la garantie centrale de ce module : Redis absent ou en panne ne
  // doit jamais faire échouer une requête HTTP (voir le commentaire en
  // tête de cacheService.js).
  it("getCachedAvailability renvoie null sans connexion active", async () => {
    expect(await cacheService.getCachedAvailability(1, "2099-01-05")).toBeNull();
  });

  it("isTokenBlacklisted renvoie false sans connexion active (aucun token considéré révoqué)", async () => {
    expect(await cacheService.isTokenBlacklisted("un-token")).toBe(false);
  });

  it("setCachedAvailability et blacklistToken ne lèvent pas d'erreur sans connexion active", async () => {
    await expect(
      cacheService.setCachedAvailability(1, "2099-01-05", ["09:00"]),
    ).resolves.toBeUndefined();
    await expect(cacheService.blacklistToken("un-token", 60)).resolves.toBeUndefined();
  });
});

describe("cacheService - Redis connecté (client simulé)", () => {
  let cacheService;
  let store;
  let handlers;
  let mockClient;

  beforeEach(() => {
    jest.resetModules();
    store = new Map();
    handlers = {};

    mockClient = {
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn((key) => Promise.resolve(store.has(key) ? store.get(key).value : null)),
      set: jest.fn((key, value, options) => {
        store.set(key, { value, ttl: options?.EX });
        return Promise.resolve("OK");
      }),
      del: jest.fn((key) => {
        const existed = store.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
    };

    jest.doMock("redis", () => ({ createClient: jest.fn(() => mockClient) }));

    cacheService = require("../services/cacheService");
    cacheService.connectCache();
    // Simule l'événement "ready" émis par le client réel une fois la
    // connexion établie : sans cet appel, isReady resterait false et les
    // fonctions ci-dessous se comporteraient comme en mode dégradé.
    handlers.ready();
  });

  it("met en cache une disponibilité avec la durée de vie attendue, puis la retrouve", async () => {
    await cacheService.setCachedAvailability(1, "2099-01-05", ["09:00", "09:30"]);

    expect(mockClient.set).toHaveBeenCalledWith(
      "dispo:1:2099-01-05",
      JSON.stringify(["09:00", "09:30"]),
      { EX: 30 },
    );

    const cached = await cacheService.getCachedAvailability(1, "2099-01-05");
    expect(cached).toEqual(["09:00", "09:30"]);
  });

  it("expire une disponibilité en cache dès qu'elle est invalidée (réservation/annulation)", async () => {
    await cacheService.setCachedAvailability(1, "2099-01-05", ["09:00"]);
    expect(await cacheService.getCachedAvailability(1, "2099-01-05")).toEqual(["09:00"]);

    await cacheService.invalidateAvailability(1, "2099-01-05");

    expect(await cacheService.getCachedAvailability(1, "2099-01-05")).toBeNull();
  });

  it("met un token en liste noire avec la durée de vie restante du JWT, puis le reconnaît comme révoqué", async () => {
    await cacheService.blacklistToken("un-token", 120);

    expect(mockClient.set).toHaveBeenCalledWith("revoque:un-token", "1", { EX: 120 });
    expect(await cacheService.isTokenBlacklisted("un-token")).toBe(true);
    expect(await cacheService.isTokenBlacklisted("un-autre-token")).toBe(false);
  });

  it("n'inscrit jamais en liste noire un token déjà expiré (TTL <= 0)", async () => {
    await cacheService.blacklistToken("token-expire", 0);

    expect(mockClient.set).not.toHaveBeenCalled();
    expect(await cacheService.isTokenBlacklisted("token-expire")).toBe(false);
  });
});
