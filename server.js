const express = require("express"); // 라이브러리 사용
const app = express(); // 객체

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");

// middleware : 요청과 응답 사이에서 동작
app.use("/public", express.static("public")); // static파일을 보관하기 위해 public폴더 사용

let db;
// db 접속 완료되면 내부 함수 실행하여 8080에 nodejs 서버 띄운다
MongoClient.connect(
  "mongodb+srv://soldaAdmin:0570@cluster0323.ei5d3.mongodb.net/todoapp?retryWrites=true&w=majority",
  (에러, client) => {
    if (에러) {
      return console.log(에러);
    }
    // todoapp이라는 db로 연결
    db = client.db("todoapp");
    // db에 저장
    // db.collection("post").insertOne({ _id: 123, 이름: "존 레논", 나이: 40 }, (에러, 결과) => {
    //   console.log("저장완료");
    // });

    app.listen(8080, function () {
      console.log("listening on 8080 '3'");
    });
  }
);

app.get("/pet", (req, res) => {
  res.send("Welcome to pet world!");
});

app.get("/main", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

app.post("/add", (req, res) => {
  res.send("전송완료");

  // 하나만 찾기
  // name이 게시물갯우인 쿼리문
  db.collection("counter").findOne({
    name: "게시물갯수",
    function(error, result) {
      let total = result.totalPost;
      //<body><input name="title" /></body>
      db.collection("post").insertOne({ _id: total + 1, 제목: req.body.title, 날짜: req.body.date }, (에러, 결과) => {
        console.log("저장완료");

        db.collection("counter").updateOne({ name: "게시물갯수" }, { $inc: { totalPost: 1 } }, (err, result) => {
          if (err) return console.log(err);
        });
      });
    },
  });
});

app.get("/list", (req, res) => {
  // db에 저장된 데이터 전부 꺼내기
  db.collection("post")
    .find()
    .toArray((error, result) => {
      console.log(result);
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

app.get("/detail/:id", (req, res) => {
  // req.params.id : :id parameter
  db.collection("post").findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    res.render("detail.ejs", { date: result });
  });
});
