## Module 5 - Authentication and Authorization

npm install \
cookie-parser@1.4.0 @types/cookie-parser@1.4.0 \
jsonwebtoken@8.5.1 @types/jsonwebtoken@8.5.1 \
express-session@1.17.3 @types/express-session@1.17.3 --include=dev

```
server: {
  proxy: {
    "^/api/.*": {
      target: "http://localhost:8000/",
      changeOrigin: true,
      rewrite: (path) => {
        const p = path.replace(/^\/api/, "");
        return p;
      },
    },
  },
}
```
