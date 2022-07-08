import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jsonwebtoken from "jsonwebtoken";
import { today, thisWeek, thisMonth, Post } from "../posts";
import { NewUser, User } from "../users";
import { readPosts } from "./posts";

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());

const allPosts = [today, thisWeek, thisMonth];
const allUsers: User[] = [];

app.get("/posts", (req, res) => {
  res.json(allPosts);
});

app.put<{}, {}, Post>("/posts", (req, res) => {
  const index = allPosts.findIndex((x) => x.id === req.body.id);
  if (index === -1) {
    throw Error(`Post with id ${req.body.id} was not found`);
  }
  const existingPost = allPosts[index];
  allPosts[index] = { ...existingPost, ...req.body };
  res.json(allPosts[index]);
});

app.post<{}, {}, Post>("/posts", (req, res) => {
  const post = { ...req.body, id: (Math.random() * 100000).toFixed() };
  allPosts.push(post);
  res.json(post);
});

const SECRET = "my-secret";
const COOKIE = "vuejs-jwt";

function authenticate(id: string, req: Request, res: Response) {
  const token = jsonwebtoken.sign({ id }, SECRET, {
    issuer: "vuejs-course",
    expiresIn: "30 days",
  });
  res.cookie(COOKIE, token, { httpOnly: true });
}

app.get("/current-user", (req, res) => {
  try {
    const token = req.cookies[COOKIE];
    const result = jsonwebtoken.verify(token, SECRET) as { id: string };
    res.json({ id: result.id });
  } catch (e) {
    res.status(404).end();
  }
});

app.post("/logout", (req, res) => {
  res.cookie(COOKIE, "", { httpOnly: true });
  res.status(200).end();
});

app.post<{}, {}, NewUser>("/login", (req, res) => {
  const targetUser = allUsers.find((x) => x.username === req.body.username);

  if (!targetUser || targetUser.password !== req.body.password) {
    res.status(401).end();
  } else {
    authenticate(targetUser.id, req, res);
    res.status(200).end();
  }
});

app.post<{}, {}, NewUser>("/users", (req, res) => {
  const user: User = { ...req.body, id: (Math.random() * 100000).toFixed() };
  allUsers.push(user);
  authenticate(user.id, req, res);
  const { password, ...rest } = user;
  res.json(rest);
});

async function start() {
  const demoPosts = await readPosts();
  allPosts.push(...demoPosts);

  app.listen(8000, () => {
    console.log("Listening on port 8000");
  });
}

start();
