import React from "react";
import { Table, Image } from "react-bootstrap-v5";
import { calculateProductCost } from "../../shared/SharedMethod";
import "../../../assets/scss/frontend/pdf.scss";
import { Tokens } from '../../../constants/index'
import { useSelector } from "react-redux";
import { connect } from "react-redux";

import {
    currencySymbolHandling,
    getFormattedDate,
    getFormattedMessage,
} from "../../../shared/sharedMethod";
class PrintData extends React.PureComponent {
    render() {

        const paymentPrint = this.props.updateProducts;
        const allConfigData = this.props.allConfigData;
        const paymentType = this.props.paymentType;
        const currency =
            paymentPrint.settings &&
            paymentPrint.settings.attributes &&
            paymentPrint.settings.attributes.currency_symbol;
            
        const firstName = localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || '';
const lastName = localStorage.getItem(Tokens.UPDATED_LAST_NAME) || '';
            
    // Calculate extra tax from inclusive tax products
let inclusiveTaxTotal = 0;

if (paymentPrint?.products && Array.isArray(paymentPrint.products)) {
  paymentPrint.products.forEach(product => {
    if (Number(product.tax_type) === 2 && Number(product.tax_value) !== 0) {
        console.log("Product : ",product);
      inclusiveTaxTotal += Number(product.tax_value)/100 * Number(product.product_price); // use tax_amount, not just tax_value
    }
  });
}

const totalTaxValue = (Number(paymentPrint.taxTotal) || 0) + inclusiveTaxTotal;
const cgst = (totalTaxValue / 2).toFixed(2);
const sgst = (totalTaxValue / 2).toFixed(2);


        

        return (
          <div 
     style={{
        padding: 0,
        height: "auto",
        marginBottom: "0px",
        overflow: "hidden"
    }}
>
    <div
        style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            color: "#000000",
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "600",
        }}
    >
        {paymentPrint.frontSetting &&
            paymentPrint.frontSetting.value.company_name}
    </div>

    <section
        style={{
            borderTop: "1px solid #dee2e6",
            borderBottom: "1px solid #dee2e6",
           
        }}
    >
        <div style={{ marginBottom: "4px" }}>
            <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                {getFormattedMessage("react-data-table.date.column.label")}:
            </span>
            <span>
                {getFormattedDate(new Date(), allConfigData && allConfigData)}
            </span>
        </div>
        {paymentPrint.settings &&
            parseInt(paymentPrint.settings.attributes.show_address) === 1 && (
                <div style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                        {getFormattedMessage(
                            "supplier.table.address.column.title"
                        )}
                        :
                    </span>
                    <span>
                        {paymentPrint.frontSetting &&
                            paymentPrint.frontSetting.value.address}
                    </span>
                </div>
            )}
        {paymentPrint.settings &&
            parseInt(paymentPrint.settings.attributes.show_email) === 1 && (
                <div style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                        {getFormattedMessage("globally.input.email.label")}:
                    </span>
                    <span>
                        {paymentPrint.frontSetting &&
                            paymentPrint.frontSetting.value.email}
                    </span>
                </div>
            )}
        {paymentPrint.settings &&
            parseInt(paymentPrint.settings.attributes.show_phone) === 1 && (
                <div style={{ marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                        {getFormattedMessage("pos-sale.detail.Phone.info")}:
                    </span>
                    <span>
                        {paymentPrint.frontSetting &&
                            paymentPrint.frontSetting.value.phone}
                    </span>
                </div>
            )}
        {paymentPrint.settings &&
    parseInt(paymentPrint.settings.attributes.show_customer) === 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
                <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
                    {getFormattedMessage("dashboard.recentSales.customer.label")}:
                </span>
                <span>
                    {paymentPrint.customer_name &&
                    paymentPrint.customer_name[0]
                        ? paymentPrint.customer_name[0].label
                        : paymentPrint.customer_name &&
                          paymentPrint.customer_name.label}
                </span>
            </div>
            

            <div>
                <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>Cashier:</span>
                <span>
                    {localStorage.getItem(Tokens.UPDATED_FIRST_NAME) || ''}{" "} - 
                     {localStorage.getItem(Tokens.UPDATED_LAST_NAME) || ''}
                </span>
            </div>
        </div>
      
    )}
    
      <div>
    <span style={{ fontWeight: "bold", marginRight: "0.5rem" }}>
        Points :
    </span>
    <span>
        {paymentPrint.customer_name &&
        paymentPrint.customer_name[0]
            ? paymentPrint.customer_name[0].points
            : paymentPrint.customer_name &&
              paymentPrint.customer_name.points}
    </span>
</div>

    </section>

    <section style={{  }}>
        {paymentPrint.products &&
            paymentPrint.products.map((productName, index) => (
                <div key={index + 1}>
                    <div style={{ padding: 0 ,fontWeight: "800"}}>
                        {index + 1}{"."} {productName.name}
                        {paymentPrint.settings &&
                        parseInt(
                            paymentPrint.settings.attributes.show_product_code
                        ) === 1 ? (
                            <span>({productName.code})</span>
                        ) : (
                            ""
                        )}
                    </div>
                    <div
                        style={{
                            borderTop: "1px solid #dee2e6",
                            borderBottom: "1px solid #dee2e6",
                            
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                border: 0,
                            }}
                        >
                            <span style={{ color: "#000000" }}>
                                {productName.quantity.toFixed(2)}{" "}
                                {(productName.product_unit === "3" && "Kg") ||
                                    (productName.product_unit === "1" && "Pc") ||
                                    (productName.product_unit === "2" && "M")}{" "}
                                X {calculateProductCost(productName).toFixed(2)}
                            </span>
                            <span style={{ textAlign: "right" }}>
                                {currencySymbolHandling(
                                    allConfigData,
                                    currency,
                                    productName.quantity *
                                        calculateProductCost(productName)
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
    </section>

    <section
        style={{
            marginTop: "1rem",
            borderTop: "1px solid #dee2e6",
            borderBottom: "1px solid #dee2e6",
            padding: "0.5rem 0",
        }}
    >
        <div style={{ display: "flex" }}>
            <div style={{ fontWeight: "500", color: "#000000" }}>
                {getFormattedMessage("pos-total-amount.title")}:
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
                {currencySymbolHandling(
                    allConfigData,
                    currency,
                    paymentPrint.subTotal || "0.00"
                )}
            </div>
        </div>
        {paymentPrint.settings &&
            parseInt(
                paymentPrint.settings.attributes.show_tax_discount_shipping
            ) === 1 && (
                <>
                   <div>
  <div style={{ display: "flex", marginBottom: "0.5rem" }}>
    <div style={{ fontWeight: "500", color: "#000000" }}>
      SGST {""}
    </div>
    <div style={{ marginLeft: "auto", textAlign: "right" }}>
      {currencySymbolHandling(allConfigData, currency, sgst || "0.00")}
    </div>
  </div>

  <div style={{ display: "flex" }}>
    <div style={{ fontWeight: "500", color: "#000000" }}>
      CGST {""}
    </div>
    <div style={{ marginLeft: "auto", textAlign: "right" }}>
      {currencySymbolHandling(allConfigData, currency, cgst || "0.00")}
    </div>
  </div>
</div>


                    <div style={{ display: "flex" }}>
                        <div style={{ fontWeight: "500", color: "#000000" }}>
                            {getFormattedMessage("globally.detail.discount")}:
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                            {currencySymbolHandling(
                                allConfigData,
                                currency,
                                paymentPrint.discount || "0.00"
                            )}
                        </div>
                    </div>
                    {parseFloat(paymentPrint.shipping) !== 0.0 && (
                        <div style={{ display: "flex" }}>
                            <div style={{ fontWeight: "500", color: "#000000" }}>
                                {getFormattedMessage("globally.detail.shipping")}
                                :
                            </div>
                            <div
                                style={{ marginLeft: "auto", textAlign: "right" }}
                            >
                                {currencySymbolHandling(
                                    allConfigData,
                                    currency,
                                    paymentPrint.shipping || "0.00"
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        <div style={{ display: "flex" }}>
            <div style={{ fontWeight: "500", color: "#000000" }}>
                {getFormattedMessage("globally.detail.grand.total")}:
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" , fontWeight: "500" }}>
                {currencySymbolHandling(
                    allConfigData,
                    currency,
                    paymentPrint.grandTotal
                )}
            </div>
        </div>
    </section>

    <table
        style={{
            width: "100%",
            marginTop: "0px",
            borderCollapse: "collapse",
        }}
    >
        <thead>
            <tr>
                <th
                    style={{
                        textAlign: "left",
                        padding: "4px 8px",
                        fontWeight: "bold",
                        color: "#000000",
                    }}
                >
                    {getFormattedMessage("pos-sale.detail.Paid-bt.title")}
                </th>
                <th
                    style={{
                        textAlign: "center",
                        padding: "8px 15px",
                        fontWeight: "bold",
                        color: "#000000",
                    }}
                >
                    {getFormattedMessage("expense.input.amount.label")}
                </th>
                <th
                    style={{
                        textAlign: "right",
                        padding: "8px 15px",
                        fontWeight: "bold",
                        color: "#000000",
                    }}
                >
                    {getFormattedMessage("pos.change-return.label")}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style={{ padding: "4px 8px", color: "#000000" }}>
                    {paymentType}
                </td>
                <td
                    style={{
                        textAlign: "center",
                        padding: "8px 15px",
                        color: "#000000",
                    }}
                >
                    {currencySymbolHandling(
                        allConfigData,
                        currency,
                        paymentPrint.grandTotal
                    )}
                </td>
                <td
                    style={{
                        textAlign: "right",
                        padding: "8px 15px",
                        color: "#000000",
                    }}
                >
                    {currencySymbolHandling(
                        allConfigData,
                        currency,
                        paymentPrint.changeReturn
                    )}
                </td>
            </tr>
        </tbody>
    </table>

    {paymentPrint && paymentPrint.note && (
        <table style={{ width: "100%" }}>
            <tbody>
                <tr style={{ border: 0 }}>
                    <td
                        style={{
                            padding: 0,
                            fontSize: "15px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "15px",
                                display: "inline-block",
                                color: "#000000",
                            }}
                        >
                            {getFormattedMessage("globally.input.notes.label")}:{" "}
                        </span>
                        <p
                            style={{
                                fontSize: "15px",
                                display: "inline-block",
                                color: "#000000",
                                margin: 0,
                            }}
                        >
                            {paymentPrint.note}
                        </p>
                    </td>
                </tr>
            </tbody>
        </table>
    )}
    
    <h4
                style={{
                    textAlign: "center",
                    color: "#000000",
                }}
            >
               {"* No Return ***** No Refund *"}
            </h4>

    {paymentPrint.settings &&
        parseInt(paymentPrint.settings.attributes.show_note) === 1 && (
            <h4
                style={{
                    textAlign: "center",
                    color: "#000000",
                    fontSize : "12px"
                }}
            >
                {paymentPrint.settings?.attributes?.notes || ""}
            </h4>
        )}
        
      
        
            
    

    <div style={{ textAlign: "center", display: "block" }}>
        {paymentPrint.settings &&
            parseInt(
                paymentPrint.settings.attributes?.show_barcode_in_receipt
            ) === 1 && (
                <Image
                    src={paymentPrint.barcode_url}
                    alt={paymentPrint.reference_code}
                    height={25}
                    width={100}
                />
            )}
        <span
            style={{
                display: "block",
                color: "#000000",
            }}
        >
            {paymentPrint.reference_code}
        </span>
    </div>
</div>

        );
    }
}

export default PrintData;
