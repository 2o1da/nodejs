let router = require("express").Router();

function 로그인했니(req, res, next) {
  // pass.deserializeUser > done(null, result)
  if (req.user) {
    next();
  } else {
    res.send("로그인을 안하셨습니다! =3=");
  }
}

router.use(로그인했니);
// router.use("/pants", 로그인했니);

// router.get("/shop/shirts", (req, res) => {
//   res.send("셔츠");
// });

// router.get("/shop/pants", (req, res) => {
//   res.send("팬츠");
// });

router.get("/shirts", 로그인했니, (req, res) => {
  res.send("셔츠");
});

router.get("/pants", (req, res) => {
  res.send("팬츠");
});

// 다른 파일을 불러 올 수 있다
// require('파일경로');
module.exports = router;
