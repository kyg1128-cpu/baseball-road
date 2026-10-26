# 베이스볼 로드

KBO·MLB 야구 커리어 게임의 공식 배포 저장소입니다.

- [웹에서 플레이·다운로드](https://baseball-road-kyg1128.onrender.com/)
- [간편 실행 HTML 다운로드](https://github.com/kyg1128-cpu/baseball-road/releases/latest/download/baseball-road.html)
- [전체 게임 ZIP 다운로드](https://github.com/kyg1128-cpu/baseball-road/releases/latest/download/baseball-road-web.zip)
- [업데이트 및 이전 버전](https://github.com/kyg1128-cpu/baseball-road/releases)

이번 지원판은 HTML과 ZIP 모두 다시 열거나 새로고침할 때 새 버전을 확인합니다. 인터넷이 끊기면 마지막으로 저장된 버전 또는 포함된 버전으로 실행합니다. 예전에 배포된 순수 오프라인 파일은 이 지원판을 한 번 새로 받아야 합니다. HTML은 다운로드 후 Chrome 또는 Edge로 열면 실행됩니다. 게임 내 저장 내보내기로 진행 상황을 보관할 수 있습니다.

## 휴대폰 플레이

Android는 Chrome의 설치 메뉴, iPhone은 Safari의 공유 → 홈 화면에 추가로 실행 아이콘을 만들 수 있습니다. 파일 다운로드 대신 웹 플레이 주소를 사용합니다. 휴대폰의 자동 회전을 켜면 편집·경기 레이아웃이 가로와 세로에 맞춰 바뀝니다.

2026.10.26.1은 커스터마이징 미리보기·설정 분할, 확대·축소·드래그 회전, 저장 버튼 고정, 터치 영역, 가로 경기 패널, 메뉴·계약·데이트·인터뷰 화면을 개선했습니다. 412×892와 384×832 및 가로 크기에서 브라우저로 검증했습니다. 실물 Galaxy S26 Ultra의 GPU·발열·배터리 성능을 측정한 것은 아닙니다. 기기 간 진행 데이터는 자동 동기화되지 않으며 게임 내 저장 파일 내보내기·가져오기로 옮길 수 있습니다.

## Render 배포

이 저장소의 `render.yaml`을 Blueprint로 연결하거나 Static Site를 생성합니다.

- Build command: `npm ci --ignore-scripts && npm run build && npm test`
- Publish directory: `public`
- 게임 플레이 경로: `/play/`
- 다운로드 안내 페이지: `/`

Render 빌드는 `release.json`에 지정된 GitHub Release의 ZIP을 받아 SHA-256과 크기를 확인하고 게임 파일을 추출합니다. 간편 실행 HTML의 압축된 실행 코드를 공개 업데이트 파일로 함께 배포합니다. 다운로드판은 실행 코드를 확인한 뒤 같은 파일 주소 안에서 실행해 저장 데이터가 다른 사이트로 이동하지 않습니다. 다운로드 버튼은 GitHub Releases의 원본 파일로 연결됩니다. 빌드에는 비밀 키가 필요하지 않습니다.

## 업데이트

1. 원본 게임 개발 폴더에서 필요한 테스트를 통과시킨 뒤 `node build-netlify.cjs --skip-tests`로 HTML과 ZIP을 다시 생성합니다. 이 저장소는 개발 폴더와 같은 상위 폴더에 둡니다.
2. 이 저장소에서 `npm run prepare-release -- --version 2026.10.26.1`처럼 새 버전을 지정합니다. ZIP 안의 실제 빌드 ID를 자동으로 읽고, 런처 2종과 `release.json`의 크기·SHA-256을 함께 생성합니다. 게임이 달라졌는데 버전을 그대로 쓰면 중단합니다. `--dry-run`은 파일을 바꾸지 않고 버전과 빌드 ID만 확인합니다.
3. `npm run build -- --archive ./release-assets/baseball-road-web.zip`과 `npm test`를 통과시킵니다.
4. 새 태그의 GitHub Release 초안에 `release-assets/baseball-road.html`과 `baseball-road-web.zip`을 올리고 업로드 완료 후 Release를 공개합니다. 기존 공개 태그의 파일은 덮어쓰지 않습니다.
5. 해당 Release가 공개된 다음 `release.json`을 main에 커밋합니다. Render가 파일 크기·해시를 검증해 자동으로 배포합니다. GitHub에서 파일이 아직 준비되지 않았다면 빌드가 실패하며 기존 사이트는 유지됩니다.
6. Render의 Live 상태와 `/release.json`, `/runtime/game.bin`을 확인합니다. 다운로드판은 다음 실행·새로고침 시 새 빌드를 받고, 실패하면 기존 실행 코드로 시작합니다.

게임 실행 소스·리소스 및 포함된 오픈소스 라이선스는 Release의 웹 ZIP 안에 있습니다. 개인 저장 데이터, 개발 중 백업, 임시 첨부 파일, 인증 정보는 배포 파일에 포함하지 않습니다. 이 저장소는 제삼자 상표나 게임에 포함된 개별 리소스의 권리를 새로 허여하지 않습니다.

## 로컬 검증

```sh
npm ci --ignore-scripts
npm run build -- --archive ./release-assets/baseball-road-web.zip
npm test
```

자동 업데이트는 실행 또는 새로고침 시에만 적용하며 플레이 중 강제로 재시작하지 않습니다. 브라우저 저장 공간이 제한되면 새 코드의 오프라인 보관이 제한될 수 있습니다. 게임 진행 데이터의 내보내기는 그대로 지원합니다.

로컬 검증용 `release-assets/`와 빌드 결과 `public/`은 Git에 커밋하지 않습니다.
