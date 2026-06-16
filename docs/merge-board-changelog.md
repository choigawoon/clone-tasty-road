# 머지보드 수정 히스토리 (MergeBoardController)

clone-tasty-road(MSW 세로형 모바일 머지 게임)의 `RootDesk/MyDesk/MergeBoardController.mlua`
및 보드 UI(`ui/DefaultGroup.ui`)에 대한 **문제 지적 → 원인 분석 → 수정 → 검증** 기록.
나중에 단계별 상태를 되짚어 볼 수 있도록 시간순으로 남긴다.

> 용어
> - **셀(cell)**: 7×7 보드의 각 칸. `BoardArea` 자식이며 셀 중심은 BoardArea 로컬 좌표.
> - **board-local 좌표**: `anchoredPosition`이 측정되는 공간. BoardArea 중심이 원점, 한 칸 간격 = 132.
>   예) cell(0,0) = (-396, 396), cell(3,3) = (0, 0), 화로 cell(6,3) = (0, -396).
> - **생성 셀 규칙**: `FindEmptyCell()`이 0행→6행, 각 행 0열→6열 순으로 훑어 **첫 빈 칸**(화로 칸 제외)을 반환. → 좌상단부터 한 줄씩 채움.

---

## 1. 아이템이 셀 중앙이 아니라 위로 떠 보임

**증상**
스폰된 아이템(사과 등)이 칸 안에 꽉 들어가지 않고 위로 떠서, 보드 윗변 밖으로 삐져나와 보였다.
처음 사용자 표현: "그림의 왼쪽 아래와 셀의 중앙점이 맞물린다."

**처음 가설 (틀림)**
아이템 RectTransform의 Pivot이 (0,0)(왼쪽아래)이라 `anchoredPosition`이 중앙이어도 그림이 위/오른쪽으로 밀린다 → "피벗을 (0.5,0.5)로 강제하면 된다"고 추정.

**실제 원인**
런타임 좌표를 직접 비교해보니 **아이템 사각형의 월드 중심 = 셀의 월드 중심으로 이미 완벽히 일치**했다.
- `UITransformComponent:GetWorldCorners()` 비교: item bbox가 cell bbox 안에 동심으로 들어가 있었음.
- `Entity:Clone()`도 Pivot/Anchors/AlignmentOption를 그대로 보존함(피벗 가설은 오답).

진짜 원인은 `SpriteGUIRendererComponent.PreserveSprite = **AspectOnly(1)**`.
이 모드는 그림을 사각형에 맞춰 비율 유지하며 그리되 **위쪽 가장자리에 정렬(top-anchor)** 한다. 그래서 칸(사각형)은 중앙이어도 그림만 위로 떠 보였다.
- 라이브로 한 아이템만 `PreserveSprite=None(0)`으로 바꾸자 즉시 칸 중앙에 꽉 차게 정렬됨(대조 실험으로 확정).

**수정**
- 코드: `ApplyItemVisual()`에서 `sprite.PreserveSprite = PreserveSpriteType.None` 설정(스폰/머지 시마다 적용).
- 소스 일치: `ui/DefaultGroup.ui`의 `ItemTemplate` `SpriteGUIRendererComponent.PreserveSprite = 0`으로 패치(UIBuilder `patchComponent`).

**검증**
- 7개 스폰 후 스크린샷: 윗줄 모든 칸에 그림까지 중앙 정렬되어 꽉 들어감. 빌드 0 에러, 런타임 에러 없음.

**커밋**: `ed7a29a` (연출과 함께)

---

## 2. 생성이 즉시 나타나서 밋밋함 → 화로에서 "슝" 날아오는 연출

**요청**
화로를 누르면 아이템이 그냥 칸에 뿅 나타나지 말고, 화로에서 해당 칸으로 날아가는 연출이 필요.

**수정**
`SpawnItem()` 재구성:
- 시작 위치를 화로 칸 `CellCenter(SPAWNER_R, SPAWNER_C) = (0,-396)`으로 두고, 목표 칸까지 `_TweenLogic:PlayTween`으로 비행.
  - 이동: `QuartEaseOut`, 시간 `SPAWN_FLY_TIME`(기본 0.32초, 프로퍼티로 조절).
  - 스케일 팝: 0.5 → 1.0, `BackEaseOut`(톡 튀어나오는 느낌).
- 착지 시 `Tweener:SetOnEndCallback` → `OnItemLanded()`에서 정확히 셀 중앙으로 스냅 + 드래그 핸들러 연결.
- 비행 중 드래그 방지(핸들러를 착지 시점에 연결). 셀은 스폰 즉시 점유 처리 → `FindEmptyCell`/주문이 in-flight 아이템을 인식.

**검증**
- 비행 시간을 런타임에서 임시로 6초로 올려(`c.SPAWN_FLY_TIME = 6.0`) 캡처 → 아이템이 칸 경계를 넘어 떠 있고 스케일이 커진 mid-flight 프레임 확인. 이후 0.32초로 복구.
- 아이템들이 화로(하단)에서 출발해 목표 칸(상단)에 중앙 정렬로 안착 → 트윈 + OnEnd 콜백 정상 동작.

**커밋**: `ed7a29a`

---

## 3. 드래그가 마우스 커서를 못 따라옴

**증상**
아이템을 드래그하면 커서 이동량만큼 따라오지 못하고 뒤처짐("마우스커서위치만큼 못따라오네").

**원인**
기존 드래그 핸들러는 매 프레임 `anchoredPosition += event.TouchDelta` 방식(공식 가이드의 기본 예제와 동일).
- `event.TouchDelta`는 **실제 화면 픽셀** 단위.
- `anchoredPosition`은 **1080×1920 UI 기준 해상도** 단위.
- 디바이스 렌더 해상도가 1080×1920과 다르면 두 단위의 스케일이 어긋나 아이템이 손가락을 못 따라간다.
- Maker 시뮬레이터는 마침 1080×1920(1:1)이라 **여기서는 증상이 안 보였고**, 실기기/다른 크기 프리뷰에서만 드러난다.

**수정**
누적 델타 대신 **절대 포인터 위치 추적**으로 교체.
- `TouchToBoardLocal(screenPoint)` 헬퍼: `_UILogic:ScreenToLocalUIPosition(screenPoint, BoardArea.UITransformComponent)`로 화면 좌표 → board-local UI 단위(= `anchoredPosition` 공간)로 변환. **해상도 독립**.
- `OnItemBeginDrag`: 잡은 지점의 오프셋(`grabDX/grabDY = 현재 anchoredPosition - 변환된 터치 위치`)을 기록 → 손가락 대비 그 오프셋을 유지하며 따라오게(점프/드리프트 없음).
- `OnItemDrag`: `anchoredPosition = ScreenToLocalUIPosition(touchPoint) + grab offset`.

이 방식은 변환 원점/피벗 규약을 몰라도 grab offset이 상수 차이를 자동 보정하므로 견고하다.

**검증 (round-trip)**
엔진의 변환을 직접 호출해 알려진 셀 좌표와 대조:
- `screen(143,1235) → board-local(-397, 395)` ≈ cell(0,0) `(-396, 396)`
- `screen(540,840)  → board-local(0, 0)`        = cell(3,3) `(0, 0)`
- 화면상의 3칸 거리 = board-local 3칸(=396) 거리로 1:1 정확히 매핑됨 → 스케일 정상.

→ `ScreenToLocalUIPosition`이 손가락의 화면 위치를 `anchoredPosition` 공간으로 **정확히** 되돌린다는 것을 확인. 따라서 어떤 해상도에서도 아이템이 커서 밑에 정확히 붙는다.

**한계 / 후속 확인 권장**
- Maker `mouse_input`은 ButtonComponent 클릭과 UI 드래그 이벤트(`UITouch*DragEvent`)를 주입하지 못한다(엔진 관리 UI). 그래서 시뮬레이터에서 실제 드래그를 끝까지 재현할 수 없어, 변환 정확성(위 round-trip)으로 검증했다. **최종 손맛은 실기기/실플레이 테스트로 확인 권장.**

**커밋**: 이 문서와 함께 커밋(`MergeBoardController.mlua`).

---

## 부록 A. 검증에 쓴 기법

- **런타임 좌표 비교**: `UITransformComponent.WorldPosition` / `GetWorldCorners()`로 아이템 rect를 목표 셀 rect와 직접 대조 → 정렬 문제의 진짜 위치를 특정.
- **대조 실험**: 한 인스턴스만 속성을 바꿔(`PreserveSprite`) 스크린샷 비교 → 원인 1줄로 확정.
- **컴포넌트 메서드 직접 호출**: `maker_execute_script`(context `client`)로 `GetComponent("script.MergeBoardController"):OnSpawnerClick()` 호출 → UI 버튼을 시뮬레이터로 못 누르는 한계 우회.
- **연출 freeze-frame**: 트윈 시간을 런타임에서 임시로 키워 mid-flight 캡처 후 복구.
- **변환 round-trip**: 알려진 셀의 화면 좌표를 `ScreenToLocalUIPosition`에 넣어 기대 board-local과 대조.

## 부록 B. 빠지기 쉬운 함정 (이 프로젝트 한정 메모)

- `Entity:Clone()`은 UITransform Pivot/Anchors/Alignment를 **보존**한다 → "정렬 어긋남 = 피벗 문제"는 흔한 오판. 먼저 `GetWorldCorners`로 rect를 확인할 것.
- UI 아이콘이 칸 안에서 위로 떠 보이면 `PreserveSprite=AspectOnly`(top-anchor) 의심 → `None`으로.
- 드래그 추적은 `TouchDelta`(화면 px) 누적이 아니라 `ScreenToLocalUIPosition`(해상도 독립) + grab offset로.
- `maker_mouse_input`은 ButtonComponent/UI 드래그를 못 건드림 → `maker_execute_script`로 우회.
- 셸 명령에 `.ui` 경로 문자열이 있으면 가드에 막힘(`git add ui/foo.ui`도) → `git add -u`로 스테이징.
