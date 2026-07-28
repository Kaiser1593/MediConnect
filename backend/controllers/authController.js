const registerUser = async (req, res) => {
  const {
    firstname,
    lastname,
    email,
    role,
    password,
    confirmPassword,
  } = req.body;

  if (
    !firstname ||
    !lastname ||
    !email ||
    !role ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs obligatoires doivent être renseignés.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Les mots de passe ne correspondent pas.",
    });
  }

  const allowedRoles = ["patient", "doctor"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Le type de compte sélectionné est invalide.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Route d'inscription fonctionnelle.",
    user: {
      firstname,
      lastname,
      email,
      role,
    },
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "L'adresse e-mail et le mot de passe sont obligatoires.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Route de connexion fonctionnelle.",
    user: {
      email,
    },
  });
};

module.exports = {
  registerUser,
  loginUser,
};