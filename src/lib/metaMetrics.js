export function getActionValue(
  actions = [],
  actionType,
) {
  if (!Array.isArray(actions)) {
    return 0;
  }

  const action = actions.find(
    (item) =>
      item.action_type === actionType,
  );

  return Number(action?.value || 0);
}

export function getLinkClicks(
  actions = [],
) {
  return getActionValue(
    actions,
    "link_click",
  );
}

export function getLandingPageViews(
  actions = [],
) {
  return getActionValue(
    actions,
    "landing_page_view",
  );
}

export function getAddToCart(
  actions = [],
) {
  return getActionValue(
    actions,
    "add_to_cart",
  );
}

export function getInitiateCheckout(
  actions = [],
) {
  return getActionValue(
    actions,
    "initiate_checkout",
  );
}

export function getAddPaymentInfo(
  actions = [],
) {
  return getActionValue(
    actions,
    "add_payment_info",
  );
}

export function getPurchases(
  actions = [],
) {
  return getActionValue(
    actions,
    "purchase",
  );
}

export function getLeads(
  actions = [],
) {
  return getActionValue(
    actions,
    "lead",
  );
}

export function parseMetaActions(
  actions = [],
) {
  return {
    linkClicks:
      getLinkClicks(actions),

    landingPageViews:
      getLandingPageViews(actions),

    atc:
      getAddToCart(actions),

    initiateCheckout:
      getInitiateCheckout(actions),

    addPaymentInfo:
      getAddPaymentInfo(actions),

    purchases:
      getPurchases(actions),

    leads:
      getLeads(actions),
  };
}