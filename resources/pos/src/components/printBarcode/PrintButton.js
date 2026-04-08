import React from "react";
import JsBarcode from "jsbarcode";
import {
    currencySymbolHandling,
    getFormattedMessage,
} from "../../shared/sharedMethod";

class PrintButton extends React.PureComponent {
    componentDidMount() {
        this.generateAllBarcodes();
    }

    componentDidUpdate() {
        this.generateAllBarcodes();
    }

    generateAllBarcodes = () => {
        const { updateProducts: print } = this.props;
        const paperSize = print.paperSize;

        if (paperSize.value !== 9) return;

        print.products.forEach((product, index) => {
            for (let i = 0; i < product.quantity; i++) {
                const barcodeId = `barcode-${index}-${i}`;
                const element = document.getElementById(barcodeId);

                if (element && product.code) {
                    JsBarcode(element, product.code, {
                        format: "CODE128",
                        width: 2.5,        // Thicker bars
                        height: 42,        // Taller barcode
                        displayValue: false,
                        margin: 0,
                    });
                }
            }
        });
    };

    render() {
        const { updateProducts: print, allConfigData, frontSetting } = this.props;
        const paperSize = print.paperSize;
        const currencySymbol = frontSetting?.value?.currency_symbol || "₹";

        const renderOnlyBarcodeLabels = (product, index) => {
            const labels = [];
            const price = !isNaN(product.product_price)
                ? product.product_price
                : !isNaN(product.product_cost)
                ? product.product_cost
                : 0;

            for (let i = 0; i < product.quantity; i++) {
                const barcodeId = `barcode-${index}-${i}`;

                labels.push(
                    <div
                        key={`${index}-${i}`}
                        style={{
                            width: "24.4mm",
                            height: "20mm",
                            padding: "1mm",
                            margin: 0,
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "0.1mm solid #e0e0e0",
                        }}
                    >
                        {/* Item Name */}
                        <div style={{ fontWeight: "bold", fontSize: "6px" }}>
                            {product.name || "Unnamed"}
                        </div>

                        {/* Price */}
                        <div style={{ fontWeight: "bold", fontSize: "6px" }}>
                            {getFormattedMessage("product.table.price.column.label")}:{" "}
                            {currencySymbolHandling(allConfigData, currencySymbol, price)}
                        </div>

                        {/* Barcode */}
                        <svg
                            id={barcodeId}
                            style={{
                                width: "22mm",
                                height: "11mm", // ~42px
                                objectFit: "contain",
                            }}
                        ></svg>

                        {/* Product Code */}
                        <div style={{ fontWeight: "bold", fontSize: "6px" }}>
                            {product.code || "000000"}
                        </div>
                    </div>
                );
            }

            return labels;
        };

        return (
            <div style={{ padding: 0, margin: 0 }}>
                {paperSize.value === 9 ? (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            width: "100mm",
                            gap: "0mm",
                            justifyContent: "center",
                        }}
                    >
                        {print.products &&
                            print.products.flatMap((product, index) =>
                                renderOnlyBarcodeLabels(product, index)
                            )}
                    </div>
                ) : (
                    <div>Unsupported paper size</div>
                )}
            </div>
        );
    }
}

export default PrintButton;
