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
    const paymentDetails = this.props.paymentDetails;
    const currency =
      paymentPrint.settings &&
      paymentPrint.settings.attributes &&
      paymentPrint.settings.attributes.currency_symbol;

    const firstName = localStorage.getItem(Tokens.FIRST_NAME) || '';
    const lastName = localStorage.getItem(Tokens.LAST_NAME) || '';

    console.log("firstName", firstName);

    // Calculate extra tax from inclusive tax products
    let inclusiveTaxTotal = 0;

    if (paymentPrint?.products && Array.isArray(paymentPrint.products)) {
      paymentPrint.products.forEach(product => {
        if (Number(product.tax_type) === 2 && Number(product.tax_value) !== 0) {
          console.log("Product : ", product);
          inclusiveTaxTotal += Number(product.tax_value) / 100 * Number(product.product_price); // use tax_amount, not just tax_value
        }
      });
    }

    const totalTaxValue = (Number(paymentPrint.taxTotal) || 0) + inclusiveTaxTotal;
    const cgst = (totalTaxValue / 2).toFixed(2);
    const sgst = (totalTaxValue / 2).toFixed(2);

    // Bill number: prefer API response (paymentDetails), fallback to paymentPrint
    const billNumber = (paymentDetails && paymentDetails.attributes && paymentDetails.attributes.reference_code)
      || paymentPrint.reference_code
      || '';

    console.log('Print data :', paymentPrint);




    return (

      <main className="invoice-container" role="main" aria-label="Invoice">

        <h1 className="company-name">
          {paymentPrint.frontSetting &&
            paymentPrint.frontSetting.value.company_name}
        </h1>
        <p className="text-align" aria-label="Address">
          {paymentPrint.frontSetting &&
            paymentPrint.frontSetting.value.address}
        </p>
        <p className="text-align" aria-label="GSTIN">
          <strong>GSTIN:</strong> 33BTHPM9608K1ZA
        </p>
        <p className="text-align" aria-label="FSSAI">
          <strong>FSSAI:</strong> 12423028000042
        </p>

        <h2 className="payment-mode" aria-label="Payment Mode">CASH BILL</h2>

        <section className="section" aria-label="Invoice Details">
          <div>
            <span className="label">Date:</span>
            <span> {getFormattedDate(new Date(), allConfigData && allConfigData)}</span>
          </div>
          <div>
            <span className="label">Time:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>

          <div>
            <span className="label">Bill No:</span>
            <span> {billNumber}</span>
          </div>
          <div>
            <span className="label">Cell:</span>
            <span> {paymentPrint.customer_name &&
              paymentPrint.customer_name[0]
              ? paymentPrint.customer_name[0].phoneNumber
              : paymentPrint.customer_name &&
              paymentPrint.customer_name.phoneNumber}</span>
          </div>
          <div>
            <span className="label">Customer:</span>
            <span>  {paymentPrint.customer_name &&
              paymentPrint.customer_name[0]
              ? paymentPrint.customer_name[0].label
              : paymentPrint.customer_name &&
              paymentPrint.customer_name.label}</span>
          </div>
          <div>
            <span className="label">Location:</span>
            <span>       {lastName}</span>
          </div>
          <div>
            <span className="label">Cashier:</span>
            <span>{firstName}{" "} </span>
          </div>

        </section>

        <table role="table" aria-label="Invoice Items">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Particulars</th>
              <th scope="col">Qty</th>
              <th scope="col">RATE</th>
            </tr>
          </thead>
          <tbody>
            {paymentPrint.products &&
              paymentPrint.products.map((productName, index) => (
                <tr key={index}>
                  <td style={{ padding: "4px 0" }}>{index + 1}</td>
                  <td style={{ padding: "4px 0" }}>
                    {productName.name}{" "}
                    {paymentPrint.settings &&
                      parseInt(1) === 1
                      ? `(${productName.code})`
                      : ""}
                  </td>
                  <td style={{ textAlign: "left", padding: "4px 0" }}>
                    {productName.quantity.toFixed(2)}{" "}
                    {(productName.product_unit === "3" && "Kg") ||
                      (productName.product_unit === "1" && "Pc") ||
                      (productName.product_unit === "2" && "M")}
                  </td>
                  <td style={{ textAlign: "left", padding: "4px 0" }}>
                    {currencySymbolHandling(
                      allConfigData,
                      currency,
                      productName.quantity * calculateProductCost(productName)
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="tax-summary" aria-label="Tax Summary">
          <p><strong>Tax Breakdown:</strong></p>
          <p><span>CGST:</span><span>{currencySymbolHandling(allConfigData, currency, cgst || "0.00")}</span></p>
          <p><span>SGST:</span><span>{currencySymbolHandling(allConfigData, currency, sgst || "0.00")}</span></p>
          <p>
            <span>Subtotal:</span>
            <span>{currencySymbolHandling(allConfigData, currency, (Number(paymentPrint.grandTotal) || 0) + (Number(paymentPrint.cartItemPrint?.point_discount) || 0))}</span>
          </p>
          {paymentPrint.cartItemPrint && paymentPrint.cartItemPrint.point_discount > 0 && (
            <p>
              <span>Point Discount:</span>
              <span>-{currencySymbolHandling(allConfigData, currency, paymentPrint.cartItemPrint.point_discount)}</span>
            </p>
          )}
          <p>
            <span>Grand Total:</span>
            <span>
              <strong style={{ fontSize: "1.25rem" }}>
                {currencySymbolHandling(allConfigData, currency, paymentPrint.grandTotal)}
              </strong>
            </span>
          </p>
        </div>

        <div className="tax-summary" aria-label="Customer Points">
          {paymentPrint.cartItemPrint && paymentPrint.cartItemPrint.redeem_points > 0 && (
            <p>
              <span>Points Deducted:</span>
              <span><strong>{paymentPrint.cartItemPrint.redeem_points}</strong></span>
            </p>
          )}
          <p>
            <span>Customer Points:</span>
            <span>
              <strong>
                {(() => {
                  const customer = paymentPrint.customer;
                  const currentPoints = customer ? (customer.attributes ? customer.attributes.points : customer.points) : 0;
                  const redeemedPoints = paymentPrint.cartItemPrint && paymentPrint.cartItemPrint.redeem_points || 0;
                  const earningRate = paymentPrint.settings && paymentPrint.settings.attributes && paymentPrint.settings.attributes.point_earning_rate || 50;
                  const earnedPoints = paymentPrint.grandTotal / earningRate;

                  // If backend already updated points, we don't subtract again. 
                  // But since we set paymentPrint BEFORE the response, currentPoints is STALE (the balance before this sale).
                  // So we MUST subtract redeemed and add earned.
                  const latestPoints = (Number(currentPoints) - Number(redeemedPoints) + Number(earnedPoints)).toFixed(2);
                  return latestPoints;
                })()}
              </strong>
            </span>
          </p>
        </div>

        <div className="footer-note" aria-label="Return policy and thanks">
          <p><strong>*NO Return*****No Refund*</strong></p>
          <p>Thanks for visiting SVA Mall</p>
          <p>Powered By Chakra App Studio</p>
        </div>
      </main>




    );
  }
}

export default PrintData;
