# 🎨 Concept Studio

clone-tasty-road의 **아트 디렉션 기반 컨셉아트 / 화면 목업 생성 웹툴**. 로컬에서 돌아가며,
`docs/art-direction.md` + `docs/world-and-narrative.md`에서 뽑은 프롬프트로 genai(ComfyUI) 백엔드를 호출한다.

## 무엇을 하나

- **컨셉아트 탭** — 머지 몬스터(T1~T5), 스포너 알, 티어 프레임, NPC, 지역 배경을 메이플 비비드 톤으로 생성.
- **화면 목업 탭** — 메인 보드 / 월드맵 / 의뢰 팝업 / 도감 / 에너지 상점 / 진화 연출 화면을 세로형 목업으로 생성.
- **갤러리 탭** — genai 서버의 최근 생성물 열람.
- 대상 선택 → 아트 디렉션 프롬프트 자동 작성(편집 가능) → 생성 → **`concept-art/`에 저장**.

## 구조

```
브라우저 (localhost:4321)
   └─ /api/*  →  server.mjs (Node, 의존성 0)
                    └─ genai-client.mjs  →  genai REST (https://genai.home.codepoet.site/api/images/generate)
                                                └─ ComfyUI (host:8188, RTX 4090)
생성물은 https://genai.home.codepoet.site/outputs/... 공개 URL로 서빙 → <img>로 표시
```

genai 서버는 직접 **REST API**(`POST /api/images/generate`, `GET /api/outputs`, `GET /api/config`,
Swagger는 `/api/docs`)를 제공한다. MCP(`/mcp/`)도 있지만 REST가 훨씬 단순해서 이 툴은 REST를 쓴다.
다만 genai는 **CORS가 꺼져 있어** 브라우저가 직접(cross-origin) 못 부른다 → 정적 UI 서빙 +
같은-출처 우회를 위해 로컬 Node **프록시**를 둔다 (서버 측 호출엔 CORS 무관).

## 실행

요구사항: **Node 18+** (내장 `fetch` 사용), genai 서버 + ComfyUI 가동 중.

```bash
cd tools/concept-studio
node server.mjs
# → http://localhost:4321
```

포트 변경: `PORT=5000 node server.mjs`
다른 genai 서버: `GENAI_BASE_URL=https://... node server.mjs` (기본 `https://genai.home.codepoet.site`)

## 아트 디렉션 동기화

프롬프트의 단일 소스는 [`art-direction.config.mjs`](art-direction.config.mjs)다.
팔레트·스타일·몬스터 티어·화면 목록을 바꾸려면 이 파일을 수정한다
(원 디렉션 문서 `docs/art-direction.md`, `docs/world-and-narrative.md`와 일치시킬 것).

## 메모

- 스프라이트성 대상(몬스터/알/아이콘/NPC)은 기본 `z-image-turbo-alpha`(투명배경), 배경·화면은 `z-image-turbo`.
- 생성물은 genai 서버에 항상 저장된다(갤러리에서 확인). "repo에 저장"은 `concept-art/`로 한 장 복사.
- `concept-art/`는 용량이 커질 수 있으니 필요 시 `.gitignore` 처리 권장.
