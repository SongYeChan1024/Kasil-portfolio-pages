# Kasil Portfolio Pages

안녕하세요 송예찬 이라고 합니다.
이 레포지토리는 제가 진행했던 프로젝트를 HTML 형식의 포트폴리오 페이지로 정리하기 위한 저장소이자 
개별 프로젝트 소개 페이지들을 한 곳에 모아 보여주는 포트폴리오 사이트입니다.

- 메인 페이지: 전체 프로젝트 목록 소개
- 프로젝트 상세 페이지: 프로젝트별 역할, 구현 내용, 기술 스택, 회고 정리

## 폴더 구조

```text
portfolio-pages/
├─ index.html
├─ projects/
│  ├─ lucid-diver/
│  │  └─ index.html
│  ├─ darkdock/
│  │  └─ index.html
│  └─ mosaic/
│     └─ index.html
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  └─ images/
└─ README.md
```

## 수정 방법

1. 메인 소개와 프로젝트 카드 내용은 `index.html`에서 수정합니다.
2. 프로젝트별 상세 설명은 `projects/.../index.html`에서 수정합니다.
3. 공통 색상, 여백, 버튼, 카드 스타일은 `assets/css/style.css`에서 수정합니다.
4. 프로젝트 이미지나 썸네일은 `assets/images/`에 추가합니다.

## 경로 규칙

- 메인 페이지 CSS: `./assets/css/style.css`
- 프로젝트 상세 페이지 CSS: `../../assets/css/style.css`
- 상세 페이지에서 메인으로 돌아가기: `../../index.html`

## GitHub Pages 배포

1. 변경 내용을 GitHub에 push 합니다.
2. 저장소의 `Settings`로 이동합니다.
3. `Pages` 메뉴를 엽니다.
4. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
5. 브랜치는 `main`, 폴더는 `/(root)`를 선택합니다.
6. 저장 후 잠시 기다리면 사이트가 배포됩니다.

배포 주소는 보통 아래 형식입니다.

`https://<github-username>.github.io/Kasil-portfolio-pages/`

## 메모

- 현재 들어간 프로젝트 설명과 GitHub 링크는 템플릿용 예시 문구입니다.
- 실제 프로젝트 내용, 링크, 이미지로 교체하면 바로 포트폴리오로 사용할 수 있습니다.
