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

사이트의 **글쓰기** 메뉴 또는 `/Kasil-portfolio-pages/admin/`에서 작성할 수 있습니다. Decap CMS 3.17.3과 GitHub backend를 사용합니다.

- GitHub Fine-grained token을 생성하고 `Kasil-portfolio-pages` 저장소에만 `Contents: Read and write` 권한을 줍니다. Metadata는 기본 읽기 권한을 유지합니다.
- 관리자 화면에 토큰을 입력합니다. 기본은 페이지 메모리에서만 사용합니다. 개인 PC에서는 **이 브라우저에 로그인 유지**를 선택하면 다음 접속 때 자동 로그인합니다. 이 경우 토큰은 이 사이트의 브라우저 저장소에 보관되며, 로그아웃하거나 인증에 실패하면 제거됩니다. 공용 PC에서는 선택하지 마세요. 만료·폐기된 토큰은 새로 입력해야 합니다. Decap의 기본 사용자 기록에는 토큰을 넣지 않습니다.
- **블로그 글 → 새 글**에서 제목·날짜·카테고리·태그·본문·이미지를 입력하고 저장/발행합니다. `main`에 커밋된 뒤 기존 GitHub Actions가 사이트를 배포합니다.
- 이미지는 `assets/img/uploads`에 저장하고 GitHub Pages의 baseurl을 포함한 주소로 연결합니다.
- 캡처한 이미지는 본문의 원하는 위치를 클릭하고 **Ctrl+V**로 붙여 넣습니다. Rich Text·Markdown 모드 모두 지원하며 PNG·JPEG·WebP·GIF를 한 장당 10MB까지 받을 수 있습니다. 파일 이름은 자동으로 생성하고, 글을 저장할 때 이미지도 함께 업로드합니다. 이미지 추가 후에도 글 저장이 필요합니다.
- 날짜가 미래이면 예약된 시각에 자동으로 빌드되지는 않습니다. 공개할 시각 또는 지난 시각을 입력하세요.
- 토큰을 저장소·본문·채팅에 넣지 마세요. 토큰을 잃거나 만료되면 GitHub에서 새 토큰을 만듭니다.

관리자 UI와 backend 확장은 `admin/`에 있습니다. 기존의 Markdown 파일 작성 방식도 그대로 사용할 수 있습니다.

편집기 회귀 검사는 `node --test tools/editor-regression.test.mjs tools/cache-regression.test.mjs`로 실행합니다. `node tools/editor-preview-server.mjs`로 띄운 로컬 검증 화면은 Decap의 메모리 테스트 백엔드를 사용하여 실제 GitHub에 글이나 이미지를 올리지 않습니다.

`assets/js/dist/sw.min.js`는 Chirpy의 같은 경로를 덮어쓰고 `/sw.min.js`로 출력되는 서비스 워커입니다. 인증·관리자 요청을 캐시하지 않고, 글 목록과 검색 색인은 온라인에서 최신 내용을 우선 가져옵니다. 테마·Decap 버전을 변경하면 이미지 삽입/미리보기/실행 취소/저장과 로그인 복원·로그아웃, 오프라인 캐시를 다시 확인해 주세요.

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
