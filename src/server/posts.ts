import path from "path";
import fs from "fs";
import highlightjs from "highlight.js";
import { marked } from "marked";
import { Post, today } from "../posts";

export async function readPosts() {
  const load = (filename: string) =>
    fs.readFileSync(path.join(__dirname, "content", filename), "utf-8");

  const toHtml = (markdown: string) =>
    new Promise<string>((resolve) => {
      marked.parse(
        markdown,
        {
          gfm: true,
          breaks: true,
          highlight: (code) => {
            return highlightjs.highlightAuto(code).value;
          },
        },
        (err, parseResult) => {
          resolve(parseResult);
        }
      );
    });

  const pipelineMd = load("pipeline.md");

  const pipeline: Post = {
    ...today,
    id: "10",
    title: "A Futuristic Functional Language for Web Dev - ESNext Pipelines",
    markdown: pipelineMd,
    html: await toHtml(pipelineMd),
  };

  const sourceMapsMd = load("source-maps.md");

  const sourceMaps: Post = {
    ...today,
    id: "11",
    title: "Decoding Variable Length Quantity for Source Maps",
    markdown: sourceMapsMd,
    html: await toHtml(sourceMapsMd),
  };

  const reactivityMd = load("reactivity.md");

  const reactivity: Post = {
    ...today,
    id: "12",
    title: "Building Vue 3 Reactivity from Scratch",
    markdown: reactivityMd,
    html: await toHtml(reactivityMd),
  };

  const typesafeMd = load("typesafe.md");

  const typesafe: Post = {
    ...today,
    id: "13",
    title: "Writing A Type Safe Store",
    markdown: typesafeMd,
    html: await toHtml(typesafeMd),
  };

  const introMd = load("intro.md");

  const intro: Post = {
    ...today,
    id: "14",
    title: "Course Introduction 🎉",
    markdown: introMd,
    html: await toHtml(introMd),
  };

  return [intro, typesafe, reactivity, sourceMaps, pipeline]
}
