const express = require("express");
const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", (req, res) => {
	res.render("base", { title: "Title" });
});

app.listen(4000, () => console.log("Example app listening on port 4000!"));
