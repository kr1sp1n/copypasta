# copypasta 🍝

Just a simple pastebin.com clone as a web service to paste text in memory.
I wanted to play around with deno and this is my first project with it.

## develop

```bash
denon start
```

## build docker image

```bash
docker build -t kr1sp1n/copypasta .
```

## run docker image

```bash
docker run --rm -p "8080:8080" kr1sp1n/copypasta
```