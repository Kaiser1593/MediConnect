const registerUser = async (req, res) => {
  const { firstname, lastname, email, role, password } = req.body;

  if (!firstname || !lastname || !email || !role || !password) {
    return res.status(400).json({
      success: false,
      message: "Tous les champs obligatoires doivent être renseignés.",
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
    email,
  });
};

module.exports = {
  registerUser,
  loginUser,
};