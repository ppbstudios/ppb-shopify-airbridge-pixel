(function () {
  "use strict";

  const VERSION = "1.0.2";

  // ========== Configuration ==========
  if (!window.AIRBRIDGE_CONFIG) {
    console.error("[Airbridge] AIRBRIDGE_CONFIG not found");
    return;
  }

  const config = window.AIRBRIDGE_CONFIG;

  if (!config.appKey || !config.webToken) {
    console.error("[Airbridge] Missing appKey or webToken");
    return;
  }

  const DEBUG = config.debug || false;

  function log(...args) {
    if (DEBUG) {
      console.log("[Airbridge]", ...args);
    }
  }

  log("Initializing v" + VERSION);
  log("Config:", config);

  // ========== Airbridge SDK Loader ==========
  (function (a_, i_, r_, _b, _r, _i, _d, _g, _e) {
    if (!a_[_b]) {
      var n = function () {
          var c = i_.createElement(r_);
          c.async = 1;
          c.src = _r;
          i_.head.appendChild(c);
        },
        h = {
          queue: [],
          get isSDKEnabled() {
            return !1;
          },
        };
      _i.concat(_d).forEach(function (c) {
        var a = c.split("."),
          k = a.pop();
        a.reduce(function (p, q) {
          return (p[q] = p[q] || {});
        }, h)[k] = function () {
          h.queue.push([c, arguments]);
        };
      });
      a_[_b] = h;
      if (_g > 0) {
        fetch(_r, { method: "GET", mode: "no-cors" })
          .then(() => n())
          .catch(() => n());
      } else {
        n();
      }
    }
  })(
    window,
    document,
    "script",
    "airbridge",
    "https://static.airbridge.io/sdk/latest/airbridge.min.js",
    "init startTracking stopTracking openDeeplink setDeeplinks sendWeb setUserID clearUserID setUserEmail clearUserEmail setUserPhone clearUserPhone setUserAttributes clearUserAttributes addUserAlias clearUserAlias setDeviceAlias clearDeviceAlias events.send events.signIn events.signUp events.signOut events.purchased events.addedToCart events.productDetailsViewEvent events.homeViewEvent events.productListViewEvent events.searchResultViewEvent".split(
      " "
    ),
    ["events.wait", "fetchResource", "createTouchpoint", "createTrackingLink"],
    0
  );

  // ========== Initialize Airbridge ==========
  airbridge.init({
    app: config.appKey,
    webToken: config.webToken,
    utmParsing: true,
  });

  log("Airbridge SDK initialized");

  // ========== Utility Functions ==========
  const AB = {
    s: (v, fb = "") => (v == null || v === "" ? fb : String(v)),

    n: (v, fb = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fb;
    },

    products(itemsOrVariant) {
      const toAB = (v) => ({
        productID: v?.product?.id || v?.id || undefined,
        name: v?.product?.title || v?.title || undefined,
        price: AB.n(v?.price?.amount ?? v?.price ?? 0),
        currency:
          v?.price?.currencyCode || v?.currency || config.currency || undefined,
        quantity: AB.n(v?.quantity ?? 1, 1),
        brandID: v?.product?.vendor || undefined,
        brand: v?.product?.vendor || undefined,
      });

      if (Array.isArray(itemsOrVariant)) return itemsOrVariant.map(toAB);
      if (!itemsOrVariant) return [];
      return [toAB(itemsOrVariant)];
    },

    productActionLabel(v) {
      const pid = v?.product?.id || v?.id || "EMPTY_ID";
      const brand = v?.product?.vendor || "EMPTY_VENDOR";
      const type =
        v?.product?.productType || v?.product_type || "EMPTY_PRODUCT_TYPE";
      return `${pid}_${brand}_${type}`;
    },
  };

  // ========== Event Tracking ==========

  log("Registering event subscribers...");

  // 1) Home Page View
  analytics.subscribe("page_viewed", (event) => {
    try {
      const href = event?.context?.document?.location?.href || "";
      const pathname = new URL(href).pathname;
      const isHome =
        pathname === "/" ||
        pathname === "" ||
        pathname === "/collections/main" ||
        /^\/(#.*)?$/.test(pathname);

      if (!isHome) return;

      log("Tracking: home.viewed");
      airbridge.events.send("airbridge.ecommerce.home.viewed", {});
    } catch (error) {
      console.error("[Airbridge] Error in page_viewed:", error);
    }
  });

  // 2) Collection Page View
  analytics.subscribe("collection_viewed", (event) => {
    try {
      const col = event?.data?.collection;
      const colId = AB.s(col?.id, "collection");
      const colTitle = AB.s(col?.title, "");
      const payload = { action: `${colId}_${colTitle}` };

      log("Tracking: productList.viewed", payload);
      airbridge.events.send("airbridge.ecommerce.productList.viewed", payload);
    } catch (error) {
      console.error("[Airbridge] Error in collection_viewed:", error);
    }
  });

  // 3) Search
  analytics.subscribe("search_submitted", (event) => {
    try {
      const sr = event?.data?.searchResult;
      const q = AB.s(sr?.query, "");
      const searchType = AB.s(sr?.type, "product");
      const payload = { action: q, label: searchType };

      log("Tracking: searchResults.viewed", payload);
      airbridge.events.send(
        "airbridge.ecommerce.searchResults.viewed",
        payload
      );
    } catch (error) {
      console.error("[Airbridge] Error in search_submitted:", error);
    }
  });

  // 4) Product Detail View
  analytics.subscribe("product_viewed", (event) => {
    try {
      const v = event?.data?.productVariant;
      const price = v?.price?.amount ?? v?.price ?? 0;
      const payload = {
        action: AB.productActionLabel(v),
        value: AB.n(price),
      };

      log("Tracking: product.viewed", payload);
      airbridge.events.send("airbridge.ecommerce.product.viewed", payload);
    } catch (error) {
      console.error("[Airbridge] Error in product_viewed:", error);
    }
  });

  // 5) Add to Cart
  analytics.subscribe("product_added_to_cart", (event) => {
    try {
      const line = event?.data?.cartLine;
      const v = line?.merchandise;
      const qty = AB.n(line?.quantity ?? 1, 1);
      const price = v?.price?.amount ?? v?.price ?? 0;
      const cartID = AB.s(event?.data?.cart?.id || event?.clientId);

      const payload = {
        action: AB.productActionLabel(v),
        value: AB.n(price),
        semanticAttributes: {
          cartID,
          currency: v?.price?.currencyCode || config.currency || "KRW",
          products: AB.products({ ...v, quantity: qty }),
        },
      };

      log("Tracking: addedToCart", payload);
      airbridge.events.send("airbridge.ecommerce.product.addedToCart", payload);
    } catch (error) {
      console.error("[Airbridge] Error in product_added_to_cart:", error);
    }
  });

  // 6) Cart View
  analytics.subscribe("cart_viewed", (event) => {
    try {
      const cart = event?.data?.cart;
      const cartID = AB.s(cart?.id || event?.clientId);
      const totalAmount = AB.n(cart?.totalPrice?.amount ?? 0);
      const totalQty = AB.n(cart?.totalQuantity ?? 0);
      const store = event?.data?.store;
      const storeLabel = store ? `${AB.s(store.id)}_${AB.s(store.name)}` : "";

      const payload = {
        action: cartID,
        label: storeLabel,
        value: totalAmount,
        semanticAttributes: {
          cartID,
          products: AB.products(
            (cart?.lines || []).map((li) => ({
              ...(li?.variant || li?.merchandise),
              quantity: li?.quantity,
            }))
          ),
          totalQuantity: totalQty,
          currency: cart?.totalPrice?.currencyCode || config.currency || "KRW",
        },
      };

      log("Tracking: initiateCheckout", payload);
      airbridge.events.send("airbridge.initiateCheckout", payload);
    } catch (error) {
      console.error("[Airbridge] Error in cart_viewed:", error);
    }
  });

  // 7) Order Completion
  analytics.subscribe("checkout_completed", (event) => {
    try {
      const order =
        event?.data?.order ||
        event?.data?.checkout?.order ||
        event?.data?.checkout?.order?.current ||
        null;

      const orderId =
        AB.s(order?.id) ||
        AB.s(event?.data?.checkout?.order?.id) ||
        AB.s(event?.data?.order_id) ||
        "";

      const currency =
        order?.totalPrice?.currencyCode ||
        event?.data?.checkout?.totalPrice?.currencyCode ||
        config.currency ||
        "KRW";

      const amount =
        AB.n(order?.totalPrice?.amount) ||
        AB.n(event?.data?.checkout?.totalPrice?.amount) ||
        AB.n(event?.data?.totalPrice) ||
        0;

      const lineItems =
        order?.lineItems ||
        event?.data?.checkout?.lineItems ||
        event?.data?.lineItems ||
        [];

      const totalQuantity =
        AB.n(order?.totalQuantity) ||
        AB.n(
          Array.isArray(lineItems)
            ? lineItems.reduce((sum, li) => sum + AB.n(li?.quantity ?? 0), 0)
            : 0
        );

      const products = AB.products(
        (lineItems || []).map((li) => ({
          ...(li?.variant || li?.merchandise),
          quantity: li?.quantity,
          price:
            li?.finalLinePrice?.amount ??
            li?.price?.amount ??
            li?.total ??
            undefined,
          currency,
        }))
      );

      const payload = {
        action: orderId,
        value: amount,
        semanticAttributes: {
          transactionID: orderId,
          transactionType:
            AB.s(order?.fulfillmentMethod) ||
            AB.s(order?.shippingMethod) ||
            undefined,
          totalQuantity,
          place:
            AB.s(order?.pickupLocation?.name) ||
            AB.s(order?.store?.name) ||
            config.storeName ||
            undefined,
          currency,
          products,
        },
      };

      log("Tracking: order.completed", payload);
      airbridge.events.send("airbridge.ecommerce.order.completed", payload);
    } catch (error) {
      console.error("[Airbridge] Error in checkout_completed:", error);
    }
  });

  log("All event subscribers registered");
  console.log(
    "[Airbridge] Integration v" + VERSION + " loaded for app:",
    config.appKey
  );
})();
