<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6af4137e-ae1a-4260-9db7-a56eee6454dc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 배포 (Render, 무료)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/minji2424/english_diary_app)

1. 위 버튼을 누르고 GitHub 계정으로 Render에 로그인합니다.
2. `GEMINI_API_KEY` 값에 [Google AI Studio](https://aistudio.google.com/apikey)에서 발급한 키를 입력합니다.
3. **Apply**를 누르면 빌드 후 `https://english-diary-app-xxxx.onrender.com` 형태의 주소가 생성됩니다.

설정은 `render.yaml`에 있습니다. Docker 기반 호스팅(Cloud Run, Fly.io 등)은 `Dockerfile`을 사용하세요 (포트 8080, `GEMINI_API_KEY` 환경변수 필요).

> 일기 데이터는 브라우저 localStorage에 저장되므로 기기/브라우저마다 따로 보관됩니다.
