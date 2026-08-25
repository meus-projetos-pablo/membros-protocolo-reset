fetch("http://localhost:3000/pt/reader/cd5a058b-d058-46e5-80ce-692ea1c5d96f", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain;charset=UTF-8",
    "Next-Action": "some-action-id"
  }
})
