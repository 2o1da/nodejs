const express = require("express"); // 라이브러리 사용
const app = express(); // 객체

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");

// middleware : 요청과 응답 사이에서 동작
app.use("/public", express.static("public")); // static파일을 보관하기 위해 public폴더 사용

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(session({ secret: "비밀코드", resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//app.use("/", require("./routes/shop./js"));
app.use("/shop", require("./routes/shop.js"));

const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

let db;
// db 접속 완료되면 내부 함수 실행하여 8080에 nodejs 서버 띄운다
MongoClient.connect("mongodb+srv://soldaAdmin:0570@cluster0323.ei5d3.mongodb.net/todoapp?retryWrites=true&w=majority", (에러, client) => {
  if (에러) {
    return console.log(에러);
  }
  // todoapp이라는 db로 연결
  db = client.db("todoapp");
  // db에 저장
  // db.collection("post").insertOne({ _id: 123, 이름: "존 레논", 나이: 40 }, (에러, 결과) => {
  //   console.log("저장완료");
  // });

  http.listen(8080, function () {
    console.log("listening on 8080 '3'");
  });
});

app.get("/pet", (req, res) => {
  res.send("Welcome to pet world!");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.post("/add", (req, res) => {
  // 하나만 찾기
  // name이 게시물갯수인 쿼리문
  db.collection("counter").findOne(
    {
      name: "게시물갯수",
    },
    function (error, result) {
      if (error) console.log(error);

      let total = result.totalPost;
      //<body><input name="title" /></body>
      db.collection("post").insertOne({ _id: total + 1, 제목: req.body.title_write, 날짜: req.body.date_write }, (에러, 결과) => {
        console.log("post collection에 저장완료");

        db.collection("counter").updateOne({ name: "게시물갯수" }, { $inc: { totalPost: 1 } }, (err, result) => {
          if (err) return console.log(err);
          res.send("/add로 POST 완료");
        });
      });
    }
  );
});

app.get("/list", (req, res) => {
  // db에 저장된 데이터 전부 꺼내기
  db.collection("post")
    .find()
    .toArray((error, result) => {
      console.log("GET요청으로 /list경로에 들어오면 post collecton의 배열 result는 :", result);
      // 찾은 데이터를 ejs파일에 넣기
      res.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  // req.body에 담겨 온 게시물 번호를 가진 글을 db에서 찾아서 삭제
  db.collection("post").deleteOne(req.body, (err, result) => {
    console.log("삭제 완료");
    res.status(200).send({ message: "성공했어요!" }); // object형 안해도 됨
  });
});

app.get("/detail/:idx", (req, res) => {
  // req.params.id : :id parameter
  db.collection("post").findOne({ _id: parseInt(req.params.idx) }, function (err, result) {
    res.render("detail.ejs", { data: result });
  });
});

app.get("/edit/:index", (req, res) => {
  db.collection("post").findOne({ _id: parseInt(req.params.index) }, (err, result) => {
    if (err) {
      return console.log(err);
    }
    res.render("edit.ejs", { data: result });
    console.log(result);
  });
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne({ _id: parseInt(req.body.아이디) }, { $set: { 제목: req.body.title_edit, 날짜: req.body.date_edit } }, (err, result) => {
    if (err) return console.log(err);

    console.log("수정완료");
    res.redirect("/list");
  });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// 로그인(POST요청)하면 아이디, 비밀번호 검사
app.post("/login", passport.authenticate("local", { failureRedirect: "/fail" }), (req, res) => {
  res.redirect("/");
});

app.get("/fail", (req, res) => {
  res.render("fail.ejs");
});

// 아이디, 비밀번호 인증 세부
passport.use(
  new LocalStrategy({ usernameField: "id", passwordField: "pw", session: true, passReqToCallback: false }, (입력한아이디, 입력한비밀번호, done) => {
    db.collection("login").findOne({ id: 입력한아이디 }, (err, result) => {
      if (err) return done(err);

      if (!result) return done(null, false, { message: "존재하지 않는 아이디입니다." });

      if (입력한비밀번호 == result.pw) {
        return done(null, result);
      } else {
        return done(null, false, { message: "비밀번호가 틀렸습니다." });
      }
    });
  })
);

// 로그인 성공시 id를 이용해서 세션 저장
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// 마이페이이지 접속시 동작
// 세션 데이터를 가진 사람을 DB에서 찾는다
passport.deserializeUser((아이디, done) => {
  db.collection("login").findOne({ id: 아이디 }, (err, result) => {
    done(null, result);
  });
});

app.get("/mypage", 로그인했니, (req, res) => {
  res.render("mypage.ejs", { 사용자: req.user });
});

function 로그인했니(req, res, next) {
  // pass.deserializeUser > done(null, result)
  if (req.user) {
    next();
  } else {
    res.send("로그인을 안하셨습니다!");
  }
}

app.get("/search", (req, res) => {
  const 검색조건 = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: ["제목", "날짜"],
        },
      },
    },
    { $sort: { _id: 1 } }, // -1은 내림차순
  ];
  //.aggreate(검색조건).toArray
  db.collection("post")
    .find({ $text: { $search: req.query.value } })
    .toArray((err, result) => {
      console.log("서치중", result);
      res.render("search.ejs", { searchData: result });
    });
});

let multer = require("multer");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  file: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

let upload = multer({ storage: storage });

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

// name of <input>
app.post("/upload", upload.single("프로필"), (req, res) => {
  res.send("업로드 완료");
});

app.get("/image/:이미지이름", (req, res) => {
  res.sendFile(__dirname + "public/image/" + req.params.이미지이름);
});

app.get("/chat", (req, res) => {
  res.render("chat.ejs");
});

io.on("connection", socket => {
  console.log("연결되었습니다.");

  socket.on("입력값", data => {
    console.log("입력값 수신 완료 :", data);
    io.emit("퍼트리기", data);
  });
});

let chat1 = io.of("/채팅방1");
chat1.on("connection", socket => {
  console.log("채팅방1에 입장하셨습니다.");

  let 방번호 = "";
  socket.on("방들어가고싶음", data => {
    socket.join(data);
    방번호 = data;
    console.log(`${방번호}에 입장하셨습니다.`);
  });

  socket.on("입력값", data => {
    console.log("채팅방 입력값 수신 완료 :", data);
    chat1.to(방번호).emit("퍼트리기", data);
  });
});
