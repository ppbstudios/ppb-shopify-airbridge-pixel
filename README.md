# Shopify Airbridge Custom Pixel

Shopify의 Custom Pixel에서 Airbridge SDK를 초기화하고 전자상거래 이벤트를 추적하는 통합 스크립트입니다.

## 📋 개요

이 프로젝트는 Shopify의 Customer Events Analytics와 Airbridge SDK를 연동하여 다음과 같은 전자상거래 이벤트를 자동으로 추적합니다:

- ✅ 홈 페이지 조회
- ✅ 컬렉션(상품 목록) 조회
- ✅ 검색 실행
- ✅ 상품 상세 조회
- ✅ 장바구니 추가
- ✅ 장바구니 조회 (결제 시작)
- ✅ 주문 완료 (구매 전환)

## 🚀 사용 방법

### 1. jsDelivr CDN을 통한 설치

Shopify Admin에서 Custom Pixel을 생성하고 다음 코드를 추가합니다:

```javascript
// 1. Airbridge 초기화 스크립트 로드
const script = document.createElement("script");
script.src =
  "https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/ppb-shopify-airbridge-pixel@VERSION/src/airbridge-shopify-init.js";
script.onload = function () {
  // 2. Airbridge 설정 및 초기화
  window.AirbridgeShopifyInit(analytics, {
    appKey: "YOUR_AIRBRIDGE_APP_KEY",
    webToken: "YOUR_AIRBRIDGE_WEB_TOKEN",
    currency: "KRW", // 기본 통화 코드 (선택사항)
    storeName: "YOUR_STORE_NAME", // 스토어 이름 (선택사항)
  });
};
document.head.appendChild(script);
```

### 2. 최신 버전 사용

특정 버전을 지정하거나 최신 버전을 사용할 수 있습니다:

```javascript
// 특정 버전 사용 (권장)
script.src =
  "https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/ppb-shopify-airbridge-pixel@1.0.3/src/airbridge-shopify-init.js";

// 항상 최신 버전 사용 (주의: 예기치 않은 변경사항 발생 가능)
script.src =
  "https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/ppb-shopify-airbridge-pixel/src/airbridge-shopify-init.js";
```

## ⚙️ 설정 옵션

| 옵션        | 타입   | 필수 | 설명                              |
| ----------- | ------ | ---- | --------------------------------- |
| `appKey`    | String | ✅   | Airbridge 앱 키                   |
| `webToken`  | String | ✅   | Airbridge 웹 토큰                 |
| `currency`  | String | ❌   | 기본 통화 코드 (예: 'KRW', 'USD') |
| `storeName` | String | ❌   | 스토어 이름                       |

## 📊 추적되는 이벤트

### 1. 홈 페이지 조회

- **이벤트**: `airbridge.ecommerce.home.viewed`
- **트리거**: 메인 페이지 접속 시

### 2. 상품 목록 조회

- **이벤트**: `airbridge.ecommerce.productList.viewed`
- **트리거**: 컬렉션 페이지 접속 시
- **데이터**: 컬렉션 ID, 타이틀

### 3. 검색 결과 조회

- **이벤트**: `airbridge.ecommerce.searchResults.viewed`
- **트리거**: 검색 실행 시
- **데이터**: 검색 키워드, 검색 타입

### 4. 상품 상세 조회

- **이벤트**: `airbridge.ecommerce.product.viewed`
- **트리거**: 상품 상세 페이지 접속 시
- **데이터**: 상품 ID, 브랜드, 타입, 가격

### 5. 장바구니 추가

- **이벤트**: `airbridge.ecommerce.product.addedToCart`
- **트리거**: 상품을 장바구니에 추가할 때
- **데이터**: 장바구니 ID, 상품 정보, 수량, 가격, 통화

### 6. 결제 시작

- **이벤트**: `airbridge.initiateCheckout`
- **트리거**: 장바구니 페이지 조회 시
- **데이터**: 장바구니 ID, 전체 상품 목록, 총 금액, 총 수량

### 7. 주문 완료

- **이벤트**: `airbridge.ecommerce.order.completed`
- **트리거**: 주문 완료 시
- **데이터**: 주문 ID, 상품 목록, 총 금액, 총 수량, 배송 방법

## 🔧 개발

### 프로젝트 구조

```
ppb-shopify-airbridge-pixel/
├── src/
│   └── airbridge-shopify-init.js  # 메인 통합 스크립트
└── README.md
```

### 버전 업데이트

스크립트 상단의 `VERSION` 변수를 업데이트합니다:

```javascript
const VERSION = "1.0.3";
```

### 디버깅

스크립트는 자동으로 콘솔 로그를 출력합니다:

```javascript
[Airbridge] Initializing v1.0.3
[Airbridge] Config: { appKey: "...", webToken: "..." }
[Airbridge] Airbridge SDK initialized
[Airbridge] Registering event subscribers...
[Airbridge] Tracking: home.viewed
[Airbridge] Tracking: product.viewed { action: "...", value: 29.99 }
```

브라우저 개발자 도구의 콘솔에서 `[Airbridge]` 로그를 확인하여 이벤트가 정상적으로 추적되는지 확인할 수 있습니다.

## 📝 유틸리티 함수

스크립트는 다음과 같은 내부 유틸리티를 제공합니다:

- `AB.s(value, fallback)`: 안전한 문자열 변환
- `AB.n(value, fallback)`: 안전한 숫자 변환
- `AB.products(items)`: Shopify 상품 데이터를 Airbridge 형식으로 변환
- `AB.productActionLabel(variant)`: 상품 액션 라벨 생성 (ID*브랜드*타입)

## 🛡️ 에러 처리

모든 이벤트 핸들러는 try-catch로 감싸져 있어, 하나의 이벤트에서 에러가 발생하더라도 다른 이벤트 추적에는 영향을 주지 않습니다.

```javascript
analytics.subscribe("event_name", (event) => {
  try {
    // 이벤트 처리 로직
  } catch (error) {
    console.error("[Airbridge] Error in event_name:", error);
  }
});
```

## 🔗 관련 링크

- [Airbridge SDK 문서](https://developers.airbridge.io/)
- [Shopify Customer Events](https://shopify.dev/docs/api/web-pixels-api/customer-events)
- [jsDelivr CDN](https://www.jsdelivr.com/)

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 개발팀에 문의해주세요.
