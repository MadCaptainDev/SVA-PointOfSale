import React from "react";

const CartEmptyState = ({ isProductPaneHidden }) => {
    return (
        <div className="cart-empty-state">
            <div className="ces-icon-wrap">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="ces-icon">
                    <circle cx="40" cy="40" r="40" fill="rgba(101,113,255,0.08)" />
                    <path d="M22 24h4.5l6.5 24h18l4-16H30" stroke="#6571FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    <circle cx="37" cy="53" r="2.5" fill="#6571FF"/>
                    <circle cx="51" cy="53" r="2.5" fill="#6571FF"/>
                    <path d="M44 35l4 4-4 4M60 37h-8" stroke="#00D68F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <h5 className="ces-title">Cart is empty</h5>
            <p className="ces-subtitle">
                {isProductPaneHidden
                    ? "Search for a product or scan a barcode above to add items"
                    : "Select a product from the right panel or scan a barcode"}
            </p>
            <div className="ces-tips">
                <div className="ces-tip">
                    <i className="bi bi-upc-scan ces-tip-icon" />
                    <span>Scan barcode to add instantly</span>
                </div>
                <div className="ces-tip">
                    <i className="bi bi-search ces-tip-icon" />
                    <span>Type product name in search</span>
                </div>
                <div className="ces-tip">
                    <i className="bi bi-keyboard ces-tip-icon" />
                    <span><kbd>Alt</kbd>+<kbd>S</kbd> to pay when ready</span>
                </div>
            </div>
        </div>
    );
};

export default CartEmptyState;
