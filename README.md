# 베이스볼 로드

KBO·MLB 야구 커리어 게임의 공식 배포 저장소입니다.

- [간편 실행 HTML 다운로드](https://github.com/kyg1128-cpu/baseball-road/releases/latest/download/baseball-road.html)
- [전체 게임 ZIP 다운로드](https://github.com/kyg1128-cpu/baseball-road/releases/latest/download/baseball-road-web.zip)
- [업데이트 및 이전 버전](https://github.com/kyg1128-cpu/baseball-road/releases)

이번 지원판은 HTML과 ZIP 모두 다시 열거나 새로고침할 때 새 버전을 확인합니다. 인터넷이 끊기면 마지막으로 저장된 버전 또는 포함된 버전으로 실행합니다. 예전에 배포된 순수 오프라인 파일은 이 지원판을 한 번 새로 받아야 합니다. HTML은 다운로드 후 Chrome 또는 Edge로 열면 실행됩니다. 게임 내 저장 내보내기로 진행 상황을 보관할 수 있습니다.

## Render 배포

이 저장소의 `render.yaml`을 Blueprint로 연결하거나 Static Site를 생성합니다.

- Build command: `npm ci --ignore-scripts && npm run build && npm test`
- Publish directory: `public`
- 게임 플레이 경로: `/play/`
- 다운로드 안내 페이지: `/`

Render 빌드는 `release.json`에 지정된 GitHub Release의 ZIP을 받아 SHA-256과 크기를 확인하고 게임 파일을 추출합니다. 간편 실행 HTML의 압축된 실행 코드를 공개 업데이트 파일로 함께 배포합니다. 다운로드판은 실행 코드를 확인한 뒤 같은 파일 주소 안에서 실행해 저장 데이터가 다른 사이트로 이동하지 않습니다. 다운로드 버튼은 GitHub Releases의 원본 파일로 연결됩니다. 빌드에는 비밀 키가 필요하지 않습니다.

## 업데이트

1. 게임 개발 폴더에서 테스트를 통과한 새 배포 파일을 생성합니다.
2. 새 GitHub Release에 `baseball-road.html`과 `baseball-road-web.zip`을 업로드합니다.
3. `release.json`의 버전·태그·파일 크기·SHA-256을 갱신합니다.
4. 변경 사항을 커밋하면 Render가 새 버전을 배포합니다.

게임 실행 소스·리소스 및 포함된 오픈소스 라이선스는 Release의 웹 ZIP 안에 있습니다. 개인 저장 데이터, 개발 중 백업, 임시 첨부 파일, 인증 정보는 배포 파일에 포함하지 않습니다. 이 저장소는 제삼자 상표나 게임에 포함된 개별 리소스의 권리를 새로 허여하지 않습니다.

## 로컬 검증

```sh
npm ci --ignore-scripts
npm run build -- --archive ./release-assets/baseball-road-web.zip
npm test
```

자동 업데이트는 실행 또는 새로고침 시에만 적용하며 플레이 중 강제로 재시작하지 않습니다. 브라우저 저장 공간이 제한되면 새 코드의 오프라인 보관이 제한될 수 있습니다. 게임 진행 데이터의 내보내기는 그대로 지원합니다.

로컬 검증용 `release-assets/`와 빌드 결과 `public/`은 Git에 커밋하지 않습니다.
