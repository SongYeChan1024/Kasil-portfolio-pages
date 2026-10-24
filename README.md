# Kasil Devlog

송예찬(Kasil)의 게임 기획·개발 일지, 배우고 있는 기술, 개인 개발 기록을 모으는 블로그입니다.
[Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 테마(Jekyll)로 만들고 GitHub Pages로 배포합니다.

- 사이트: https://songyechan1024.github.io/Kasil-portfolio-pages/

## 폴더 구조

```text
Kasil-portfolio-pages/
├─ _posts/       개발일지 (YYYY-MM-DD-영문-슬러그.md)
├─ _tabs/        사이드바 메뉴: 카테고리 · 태그 · 아카이브 · 기술 스택 · 개인 개발 · 소개
├─ _data/        연락처·공유 버튼 설정
├─ _config.yml   사이트 설정 (제목, 언어, 주소 등)
├─ _legacy/      예전 HTML 포트폴리오 (보관용, 사이트에 나오지 않음)
└─ .github/      GitHub Actions 배포 설정
```

## 글 쓰기

`_posts/2026-10-23-slug.md` 파일을 만들고 맨 위에 아래 머리말을 붙입니다.

```yaml
---
title: "[프로젝트] 제목"
date: 2026-10-23 23:00:00 +0900
categories: [개발일지, 프로젝트 이름]
tags: [태그1, 태그2]
---
```

- 카테고리 첫 칸은 `개발일지`, 둘째 칸은 프로젝트로 둡니다.
- 비공개 내용(연락처, 공개 전 팀 기획의 세부, 내부 문서 링크)은 올리지 않습니다. 날것의 기록은 노션 데일리로그에 둡니다.

## 로컬에서 미리 보기

Ruby와 Bundler가 필요합니다.

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://127.0.0.1:4000/Kasil-portfolio-pages/`를 엽니다.

## 배포

`main`에 push하면 GitHub Actions(`.github/workflows/pages-deploy.yml`)가 사이트를 만들어 배포합니다.
저장소 Settings → Pages → Source를 **GitHub Actions**로 바꿔 둬야 합니다.
