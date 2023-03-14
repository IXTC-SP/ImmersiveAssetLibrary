module.exports = {
  //check theres user in the session, in the backend
  isAuthenticated: async (req, res, next) => {
    try {
      // console.log("current session id ", req.session.id)
      if (req.session.passport.user) {
        req.user = req.session.passport.user;
        next();
      }
    } catch (error) {
      // console.log("unauthenticated")
      return res.redirect("/login");
    }
  },
  isUserAdmin: async (req, res, next) => {
    try {
    //   console.log(req.user);
      if (req.user.isAdmin) {
        next();
      } else {
        console.log("Only Admins are allowed to enroll")
        return res.redirect("/login");
      }
    } catch (error) {
      // console.log("unauthenticated")
      return res.redirect("/login");
    }
  },
};
