import express, { Handler, Request, RequestHandler, Response } from "express";
import type { } from "express"
import jsonwebtoken, { Jwt } from "jsonwebtoken";
import cors from "cors";
import session, { Cookie } from "express-session";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { today, thisWeek, thisMonth, Post } from "../posts";
import { NewUser, User } from "../users";

const app = express();
app.use(cors());
app.use(cookieParser())
app.use(bodyParser.json());
app.use(
  session({
    secret: "asdf",
    resave: true,
    saveUninitialized: true,
  })
);

const allPosts = [today, thisWeek, thisMonth];
const allUsers: User[] = [];

app.get("/posts", (req, res) => {
  res.json(allPosts);
});

interface AuthenticationPayload {
  token: string
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const SECRET = 'vuejs-composition-secret'
const JWT_COOKIE = 'vuejs-jwt'

const authenticationMiddleware: RequestHandler<{}, {}, AuthenticationPayload> = (req, res, next) => {
  try {
    const token = req.cookies[JWT_COOKIE]
    const content = jsonwebtoken.verify(token, SECRET) as jsonwebtoken.JwtPayload;
    req.session.userId = content?.id
    next()
  } catch (e) {
    res.status(404)
  }
}

app.get("/current-user", authenticationMiddleware, (req, res) => {
  console.log(req.session.userId)
  const user = allUsers.find(x => x.id === req.session.userId)
  if (!user) {
    res.status(404).end()
  } else {
    console.log(user)
    const { password, ...rest } = user
    res.json(rest)
  }
})

function authenticate (id: string, req: Request, res: Response) {
  const token = jsonwebtoken.sign({ id }, SECRET, {
    issuer: "vuejs-course",
    expiresIn: "30 days",
  });
  req.session.userId = id
  res.cookie(JWT_COOKIE, token, { httpOnly: true });
}

app.post<{}, {}, { id: string }>("/auth", async (req, res) => {
  const id = req.body.id;
  const token = jsonwebtoken.sign({ id }, SECRET, {
    issuer: "vuejs-course",
    expiresIn: "30 days",
  });
  res.cookie(JWT_COOKIE, token, { httpOnly: true });
  res.status(200);
  res.end();
});

app.post<{}, {}, AuthenticationPayload & { post: Post }>("/posts", authenticationMiddleware, (req, res) => {
  const post = { ...req.body.post, id: (Math.random() * 100000).toFixed() };
  allPosts.push(post);
  res.json(post);
});

app.post<{}, {}, NewUser>("/users", (req, res) => {
  const user: User = { ...req.body, id: (Math.random() * 100000).toFixed() };
  allUsers.push(user);
  authenticate(user.id, req, res)
  const { password, ...rest } = user;
  res.json(rest);
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
