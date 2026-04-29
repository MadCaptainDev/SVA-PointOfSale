import React, { useState, useEffect, useRef } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { useReactToPrint } from "react-to-print";
import Category from "./Category";
import Brands from "./Brand";
import Product from "./product/Product";
import ProductCartList from "./cart-product/ProductCartList";
import {
    posSearchNameProduct,
    posSearchCodeProduct,
} from "../../store/action/pos/posfetchProductAction";
import { fetchCustomer } from "../../store/action/customerAction";
import ProductSearchbar from "./product/ProductSearchbar";
import { prepareCartArray } from "../shared/PrepareCartArray";
import ProductDetailsModel from "../shared/ProductDetailsModel";
import CartItemMainCalculation from "./cart-product/CartItemMainCalculation";
import InlinePaymentPanel from "./cart-product/InlinePaymentPanel";
import PosHeader from "./header/PosHeader";
import { posCashPaymentAction } from "../../store/action/pos/posCashPaymentAction";
import PaymentButton from "./cart-product/PaymentButton";
import CashPaymentModel from "./cart-product/paymentModel/CashPaymentModel";
import PrintData from "./printModal/PrintData";
import PaymentSlipModal from "./paymentSlipModal/PaymentSlipModal";
import { fetchFrontSetting } from "../../store/action/frontSettingAction";
import { fetchSetting } from "../../store/action/settingAction";
import { calculateProductCost } from "../shared/SharedMethod";
import {
    fetchBrandClickable,
    posAllProduct,
} from "../../store/action/pos/posAllProductAction";
import TabTitle from "../../shared/tab-title/TabTitle";
import HeaderAllButton from "./header/HeaderAllButton";
import RegisterDetailsModel from "./register-detailsModal/RegisterDetailsModel";
import PrintRegisterDetailsData from "./printModal/PrintRegisterDetailsData";
import {
    closeRegisterAction,
    fetchTodaySaleOverAllReport,
    getAllRegisterDetailsAction,
} from "../../store/action/pos/posRegisterDetailsAction";
import {
    getFormattedMessage,
    getFormattedOptions,
} from "../../shared/sharedMethod";
import { discountType, paymentMethodOptions, toastType } from "../../constants";
import TopProgressBar from "../../shared/components/loaders/TopProgressBar";
import CustomerForm from "./customerModel/CustomerForm";
import HoldListModal from "./holdListModal/HoldListModal";
import { fetchHoldLists } from "../../store/action/pos/HoldListAction";
import { useNavigate } from "react-router";
import PosCloseRegisterDetailsModel from "../../components/posRegister/PosCloseRegisterDetailsModel.js";
import { addToast } from "../../store/action/toastAction";
import PosRegisterModel from "../../components/posRegister/PosRegisterModel.js";

const PosMainPage = (props) => {
    const {
        onClickFullScreen,
        posAllProducts,
        customCart,
        posCashPaymentAction,
        frontSetting,
        fetchFrontSetting,
        settings,
        fetchSetting,
        paymentDetails,
        allConfigData,
        fetchBrandClickable,
        posAllTodaySaleOverAllReport,
        fetchHoldLists,
        holdListData,
        fetchCustomer,
        customers,
    } = props;

    const componentRef = useRef();
    const registerDetailsRef = useRef();
    const cartTableRef = useRef(null);

    const [openCalculator, setOpenCalculator] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [updateProducts, setUpdateProducts] = useState([]);
    const [isOpenCartItemUpdateModel, setIsOpenCartItemUpdateModel] = useState(false);
    const [product, setProduct] = useState(null);
    const [cartProductIds, setCartProductIds] = useState([]);
    const [newCost, setNewCost] = useState("");
    const [paymentPrint, setPaymentPrint] = useState({});
    const [cashPayment, setCashPayment] = useState(false);
    const [modalShowPaymentSlip, setModalShowPaymentSlip] = useState(false);
    const [modalShowCustomer, setModalShowCustomer] = useState(false);
    const [productMsg, setProductMsg] = useState(0);
    const [brandId, setBrandId] = useState();
    const [categoryId, setCategoryId] = useState();
    const [selectedCustomerOption, setSelectedCustomerOption] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [updateHolList, setUpdateHoldList] = useState(false);
    const [hold_ref_no, setHold_ref_no] = useState("");
    const [cartItemValue, setCartItemValue] = useState({
        discount_type: discountType.FIXED,
        discount_value: 0,
        discount: 0,
        tax: 0,
        shipping: 0,
        redeem_points: 0,
        point_discount: 0,
    });
    const [cashPaymentValue, setCashPaymentValue] = useState({
        notes: "",
        payment_status: {
            label: getFormattedMessage("dashboard.recentSales.paid.label"),
            value: 1,
        },
    });
    const [errors, setErrors] = useState({ notes: "" });
    const [changeReturn, setChangeReturn] = useState(0);
    const [showCloseDetailsModal, setShowCloseDetailsModal] = useState(false);
    const [showPosRegisterModel, setShowPosRegisterModel] = useState(false);
    const { closeRegisterDetails } = useSelector((state) => state);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const totalQty = React.useMemo(() => {
        const localCart = updateProducts.map((u) => Number(u.quantity));
        return localCart.length > 0 ? localCart.reduce((a, b) => a + b, 0) : 0;
    }, [updateProducts]);

    const subTotal = React.useMemo(() => {
        const localTotal = updateProducts.map((u) => calculateProductCost(u).toFixed(2) * u.quantity);
        return localTotal.length > 0 ? localTotal.reduce((a, b) => a + b, 0) : 0;
    }, [updateProducts]);

    const [holdListId, setHoldListValue] = useState({ referenceNumber: "" });

    const { taxTotal, grandTotal } = React.useMemo(() => {
        const discountTotal = subTotal - cartItemValue.discount;
        const taxTotal = (discountTotal * cartItemValue.tax) / 100;
        const mainTotal = discountTotal + taxTotal;
        const grandTotal = Math.round(Number(mainTotal) + Number(cartItemValue.shipping) - Number(cartItemValue.point_discount));
        return { taxTotal, grandTotal };
    }, [subTotal, cartItemValue.discount, cartItemValue.point_discount, cartItemValue.tax, cartItemValue.shipping]);

    const { userProfile } = useSelector((state) => state);

    useEffect(() => {
        setSelectedCustomerOption(settings.attributes && {
            value: Number(settings.attributes.default_customer),
            label: settings.attributes.customer_name,
        });
        setSelectedOption(settings.attributes && {
            value: Number(settings.attributes.default_warehouse),
            label: settings.attributes.warehouse_name,
        });
    }, [settings]);

    useEffect(() => {
        if (selectedCustomerOption) {
            const customerId = selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value);
            if (customerId) fetchCustomer(customerId, false);
        }
    }, [selectedCustomerOption]);

    useEffect(() => {
        fetchSetting();
        fetchFrontSetting();
        fetchTodaySaleOverAllReport();
        fetchHoldLists();
    }, []);

    useEffect(() => {
        if (allConfigData) setShowPosRegisterModel(allConfigData?.open_register);
    }, [allConfigData]);

    useEffect(() => {
        if (updateHolList === true) {
            fetchHoldLists();
            setUpdateHoldList(false);
        }
    }, [updateHolList]);

    useEffect(() => {
        setUpdateProducts(updateProducts);
    }, [quantity, grandTotal]);

    const handleValidation = () => {
        let errors = {};
        let isValid = false;
        if (cashPaymentValue["notes"] && cashPaymentValue["notes"].length > 100) {
            errors["notes"] = "The notes must not be greater than 100 characters";
        } else {
            isValid = true;
        }
        setErrors(errors);
        return isValid;
    };

    const setCategory = (item) => setCategoryId(item);

    useEffect(() => {
        if (selectedOption) {
            fetchBrandClickable(brandId, categoryId, selectedOption.value && selectedOption.value);
        }
    }, [selectedOption, brandId, categoryId]);

    // Auto-scroll cart table to bottom when a product is added
    useEffect(() => {
        if (cartTableRef.current && updateProducts && updateProducts.length > 0) {
            cartTableRef.current.scrollTop = cartTableRef.current.scrollHeight;
        }
    }, [updateProducts]);

    const setBrand = (item) => setBrandId(item);

    const onChangeInput = (e) => {
        e.preventDefault();
        setCashPaymentValue((inputs) => ({ ...inputs, [e.target.name]: e.target.value }));
    };

    const onPaymentStatusChange = (obj) => setCashPaymentValue((inputs) => ({ ...inputs, payment_status: obj }));
    const onChangeReturnChange = (change) => setChangeReturn(change);

    const paymentTypeFilterOptions = getFormattedOptions(paymentMethodOptions);
    const paymentTypeDefaultValue = paymentTypeFilterOptions.map((o) => ({ value: o.id, label: o.name }));
    const [paymentValue, setPaymentValue] = useState({ payment_type: paymentTypeDefaultValue[0] });
    const onPaymentTypeChange = (obj) => setPaymentValue({ ...paymentValue, payment_type: obj });

    const onChangeCart = (event) => {
        if (updateProducts.length == 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cash-payment.product-error.message"), type: toastType.ERROR }));
            return;
        }
        const { value } = event.target;
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            if (decimal?.length > 2) return;
        }
        let discount = cartItemValue.discount;
        if (event.target.name == 'discount_value') {
            discount = cartItemValue.discount_type == discountType.FIXED ? value : (Number(subTotal) * Number(value)) / 100;
        }
        if (event.target.name === 'discount_type') {
            discount = value == discountType.FIXED ? cartItemValue.discount_value : (Number(subTotal) * Number(cartItemValue.discount_value)) / 100;
        }
        let pointDiscount = cartItemValue.point_discount;
        if (event.target.name === 'redeem_points') {
            const rate = settings.attributes?.point_redemption_rate || 0;
            pointDiscount = value * rate;
        }
        setCartItemValue((inputs) => ({ ...inputs, discount, point_discount: pointDiscount, [event.target.name]: value }));
    };

    const onChangeTaxCart = (event) => {
        if (updateProducts.length == 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cash-payment.product-error.message"), type: toastType.ERROR }));
            return;
        }
        const { value } = event.target;
        const values = Math.max(0, Math.min(100, Number(value)));
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            if (decimal?.length > 2) return;
        }
        setCartItemValue((inputs) => ({ ...inputs, [event.target.name]: values }));
    };

    const handleCashPayment = () => {
        setCashPaymentValue({
            notes: "",
            payment_status: { label: getFormattedMessage("dashboard.recentSales.paid.label"), value: 1 },
        });
        setCashPayment(!cashPayment);
    };

    const updateCost = (item) => setNewCost(item);
    const openProductDetailModal = () => setIsOpenCartItemUpdateModel(!isOpenCartItemUpdateModel);
    const onClickUpdateItemInCart = (item) => { setProduct(item); setIsOpenCartItemUpdateModel(true); };
    const onProductUpdateInCart = () => updateCart(updateProducts.slice());
    const updatedQty = (qty) => setQuantity(qty);
    const updateCart = (cartProducts) => setUpdateProducts(cartProducts);
    const onDeleteCartItem = (productId) => updateCart(updateProducts.filter((e) => e.id !== productId));
    const addToCarts = (items) => updateCart(items);
    const customerModel = (val) => setModalShowCustomer(val);

    const preparePrintData = () => ({
        products: updateProducts,
        discount: cartItemValue.discount || 0,
        tax: cartItemValue.tax || 0,
        cartItemPrint: cartItemValue,
        taxTotal,
        grandTotal,
        shipping: cartItemValue.shipping,
        subTotal,
        frontSetting,
        customer_name: selectedCustomerOption,
        customer: customers && customers.find(c => c.id === (selectedCustomerOption && (selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value)))),
        settings,
        note: cashPaymentValue.notes,
        changeReturn,
        payment_status: cashPaymentValue.payment_status,
    });

    const prepareData = (products) => ({
        date: moment(new Date()).format("YYYY-MM-DD"),
        customer_id: selectedCustomerOption && selectedCustomerOption[0] ? selectedCustomerOption[0].value : selectedCustomerOption && selectedCustomerOption.value,
        warehouse_id: selectedOption && selectedOption[0] ? selectedOption[0].value : selectedOption && selectedOption.value,
        sale_items: products,
        grand_total: grandTotal,
        ...(cashPaymentValue?.payment_status?.value === 1 ? { payment_type: paymentValue?.payment_type?.value } : {}),
        discount: cartItemValue.discount,
        point_discount: cartItemValue.point_discount,
        redeem_points: cartItemValue.redeem_points,
        shipping: cartItemValue.shipping,
        tax_rate: cartItemValue.tax,
        note: cashPaymentValue.notes,
        status: 1,
        hold_ref_no,
        payment_status: cashPaymentValue?.payment_status?.value,
    });

    const onCashPayment = (event, printSlip = false) => {
        event.preventDefault();
        if (handleValidation()) {
            posCashPaymentAction(prepareData(updateProducts), setUpdateProducts, setModalShowPaymentSlip, posAllProduct, { brandId, categoryId, selectedOption }, printSlip);
            setCashPayment(false);
            setPaymentPrint(preparePrintData());
            setCartItemValue({ discount_type: discountType.FIXED, discount_value: 0, discount: 0, tax: 0, shipping: 0, point_discount: 0, redeem_points: 0 });
            setCashPaymentValue({ notes: "", payment_status: { label: getFormattedMessage("dashboard.recentSales.paid.label"), value: 1 } });
            setCartProductIds("");
        }
    };

    const printPaymentReceiptPdf = () => document.getElementById("printReceipt").click();
    const printRegisterDetails = () => document.getElementById("printRegisterDetailsId").click();

    const handlePrint = useReactToPrint({ content: () => componentRef.current });
    const handleRegisterDetailsPrint = useReactToPrint({ content: () => registerDetailsRef.current });

    const [showBrowse, setShowBrowse] = useState(false); // hidden by default
    const [isDetails, setIsDetails] = useState(null);
    const [lgShow, setLgShow] = useState(false);
    const [holdShow, setHoldShow] = useState(false);

    const onClickDetailsModel = () => setLgShow(true);
    const onClickHoldModel = () => setHoldShow(true);

    const handleClickCloseRegister = () => {
        dispatch(getAllRegisterDetailsAction());
        setShowCloseDetailsModal(true);
    };

    const handleCloseRegisterDetails = (data) => {
        if (data.cash_in_hand_while_closing.toString().trim()?.length === 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cclose-register.enter-total-cash.message"), type: toastType.ERROR }));
        } else {
            setShowCloseDetailsModal(false);
            dispatch(closeRegisterAction(data, navigate));
        }
    };

    const warehouseLabel = selectedOption && (selectedOption.label || (selectedOption[0] && selectedOption[0].label));
    const firstName = userProfile?.attributes?.first_name || "";
    const lastName = userProfile?.attributes?.last_name || "";

    return (
        <div className="pos-screen">
            <TabTitle title="POS" />

            {/* Hidden print blocks */}
            <div className="d-none">
                <button id="printReceipt" onClick={handlePrint}>Print</button>
                <PrintData ref={componentRef} paymentType={paymentValue.payment_type.label} allConfigData={allConfigData} updateProducts={paymentPrint} paymentDetails={paymentDetails} />
            </div>
            <div className="d-none">
                <button id="printRegisterDetailsId" onClick={handleRegisterDetailsPrint}>Print Register</button>
                <PrintRegisterDetailsData ref={registerDetailsRef} allConfigData={allConfigData} frontSetting={frontSetting} posAllTodaySaleOverAllReport={posAllTodaySaleOverAllReport} updateProducts={paymentPrint} closeRegisterDetails={closeRegisterDetails} />
            </div>
            {/* Payment slip modal — rendered outside d-none so it shows correctly */}
            <PaymentSlipModal printPaymentReceiptPdf={printPaymentReceiptPdf} setPaymentValue={setPaymentValue} setModalShowPaymentSlip={setModalShowPaymentSlip} settings={settings} frontSetting={frontSetting} modalShowPaymentSlip={modalShowPaymentSlip} allConfigData={allConfigData} paymentDetails={paymentDetails} updateProducts={paymentPrint} paymentType={paymentValue.payment_type.label} paymentTypeDefaultValue={paymentTypeDefaultValue} />

            <TopProgressBar />

            <div className="pos-main">
                {/* ── Topbar ── */}
                <div className="topbar">
                    <div>
                        <h1 className="page-title">New Sale</h1>
                        <div className="page-sub">
                            Cashier: <strong>{firstName} {lastName}</strong>
                            {warehouseLabel && <> &nbsp;•&nbsp; {warehouseLabel}</>}
                        </div>
                    </div>
                    <div className="topbar-actions">
                        {warehouseLabel && (
                            <div className="meta-pill">
                                📍 <b>{warehouseLabel}</b>
                            </div>
                        )}
                        <div className="meta-pill">
                            🕐 <b>{moment().format("DD MMM YYYY, h:mm A")}</b>
                        </div>
                        <HeaderAllButton
                            holdListData={holdListData}
                            goToHoldScreen={onClickHoldModel}
                            goToDetailScreen={onClickDetailsModel}
                            onClickFullScreen={onClickFullScreen}
                            opneCalculator={openCalculator}
                            setOpneCalculator={setOpenCalculator}
                            handleClickCloseRegister={handleClickCloseRegister}
                        />
                    </div>
                </div>

                {/* ── 2-col layout ── */}
                <div className="row g-3">

                    {/* ── LEFT col (col-8): search + products + cart + customer + actions ── */}
                    <div className="col-lg-8 pos-left-scs">

                        {/* Add Item card */}
                        <div className="card-modern">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <div className="card-title-label" style={{ marginBottom: 0 }}>Add Item</div>
                                <button
                                    className="btn-modern btn-ghost"
                                    style={{ padding: "6px 12px !important", fontSize: "12px !important" }}
                                    onClick={() => setShowBrowse(v => !v)}
                                    title={showBrowse ? "Hide product browser" : "Show product browser"}
                                >
                                    {showBrowse ? "🙈 Hide Browse" : "🔍 Browse"}
                                </button>
                            </div>
                            <ProductSearchbar
                                customCart={customCart}
                                setUpdateProducts={setUpdateProducts}
                                updateProducts={updateProducts}
                                selectedOption={selectedOption}
                            />
                            {showBrowse && (
                                <div style={{ marginTop: "14px" }}>
                                    <Category setCategory={setCategory} brandId={brandId} selectedOption={selectedOption} />
                                    <Brands categoryId={categoryId} setBrand={setBrand} selectedOption={selectedOption} />
                                </div>
                            )}
                        </div>

                        {/* Product grid — hidden when browse is collapsed */}
                        {showBrowse && (
                            <div className="card-modern" style={{ padding: 0, overflow: "hidden" }}>
                                <Product
                                    cartProducts={updateProducts}
                                    updateCart={addToCarts}
                                    customCart={customCart}
                                    setCartProductIds={setCartProductIds}
                                    cartProductIds={cartProductIds}
                                    settings={settings}
                                    productMsg={productMsg}
                                    selectedOption={selectedOption}
                                />
                            </div>
                        )}

                        {/* Cart Items card */}
                        <div className="card-modern">
                            <div className="card-title-label">Cart Items</div>
                            <div className="cart-table-wrap" ref={cartTableRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th>{getFormattedMessage("pos-product.title")}</th>
                                            <th>{getFormattedMessage("pos-qty.title")}</th>
                                            <th>{getFormattedMessage("pos-price.title")}</th>
                                            <th colSpan="2">{getFormattedMessage("pos-sub-total.title")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updateProducts && updateProducts.length ? (
                                            updateProducts.map((updateProduct, index) => (
                                                <ProductCartList
                                                    singleProduct={updateProduct}
                                                    key={index + 1}
                                                    index={index}
                                                    posAllProducts={posAllProducts}
                                                    onClickUpdateItemInCart={onClickUpdateItemInCart}
                                                    updatedQty={updatedQty}
                                                    updateCost={updateCost}
                                                    onDeleteCartItem={onDeleteCartItem}
                                                    quantity={quantity}
                                                    frontSetting={frontSetting}
                                                    newCost={newCost}
                                                    allConfigData={allConfigData}
                                                    setUpdateProducts={setUpdateProducts}
                                                />
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: 0, border: "none" }}>
                                                    <div className="empty-state">
                                                        <span className="emoji">🛍️</span>
                                                        {getFormattedMessage("sale.product.table.no-data.label")}
                                                        <br />
                                                        <small>Scan a barcode or search above to begin</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Customer card */}
                        <div className="card-modern">
                            <div className="card-title-label">Customer</div>
                            <PosHeader
                                setSelectedCustomerOption={setSelectedCustomerOption}
                                selectedCustomerOption={selectedCustomerOption}
                                setSelectedOption={setSelectedOption}
                                selectedOption={selectedOption}
                                customerModel={customerModel}
                                updateCustomer={modalShowCustomer}
                            />
                        </div>

                        {/* Quick-action grid */}
                        <div className="action-grid">
                            <button className="btn-modern btn-ghost" onClick={onClickHoldModel}>
                                📂 Hold List
                            </button>
                            <button className="btn-modern btn-ghost" onClick={onClickDetailsModel}>
                                🖨️ Register
                            </button>
                            <button className="btn-modern btn-ghost" onClick={handleClickCloseRegister}>
                                🔒 Close
                            </button>
                            <button className="btn-modern btn-ghost" onClick={() => setModalShowCustomer(true)}>
                                👤 Customer
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT col (col-4): order summary + payment ── */}
                    <div className="col-lg-4 pos-right-scs">
                        <div className="card-modern">
                            <div className="card-title-label">Order Summary</div>

                            <CartItemMainCalculation
                                totalQty={totalQty}
                                subTotal={subTotal}
                                grandTotal={grandTotal}
                                cartItemValue={cartItemValue}
                                onChangeCart={onChangeCart}
                                allConfigData={allConfigData}
                                frontSetting={frontSetting}
                                onChangeTaxCart={onChangeTaxCart}
                                selectedOption={selectedOption}
                                customer={customers && customers.find(c => c.id === (selectedCustomerOption && (selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value))))}
                            />

                            <InlinePaymentPanel
                                grandTotal={grandTotal}
                                totalQty={totalQty}
                                subTotal={subTotal}
                                taxTotal={taxTotal}
                                cartItemValue={cartItemValue}
                                settings={settings}
                                allConfigData={allConfigData}
                                frontSetting={frontSetting}
                                cashPaymentValue={cashPaymentValue}
                                onChangeInput={onChangeInput}
                                onPaymentStatusChange={onPaymentStatusChange}
                                onPaymentTypeChange={onPaymentTypeChange}
                                onCashPayment={onCashPayment}
                                onChangeReturnChange={onChangeReturnChange}
                                errors={errors}
                                paymentTypeDefaultValue={paymentTypeDefaultValue}
                                paymentTypeFilterOptions={paymentTypeFilterOptions}
                                updateProducts={updateProducts}
                            />

                            {/* Hold + Reset buttons */}
                            <div style={{ marginTop: "12px" }}>
                                <PaymentButton
                                    updateProducts={updateProducts}
                                    updateCart={addToCarts}
                                    setUpdateProducts={setUpdateProducts}
                                    setCartItemValue={setCartItemValue}
                                    setCashPayment={setCashPayment}
                                    cartItemValue={cartItemValue}
                                    grandTotal={grandTotal}
                                    subTotal={subTotal}
                                    selectedOption={selectedOption}
                                    cashPaymentValue={cashPaymentValue}
                                    holdListId={holdListId}
                                    setHoldListValue={setHoldListValue}
                                    setUpdateHoldList={setUpdateHoldList}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isOpenCartItemUpdateModel && (
                <ProductDetailsModel
                    openProductDetailModal={openProductDetailModal}
                    productModelId={product.id}
                    onProductUpdateInCart={onProductUpdateInCart}
                    updateCost={updateCost}
                    cartProduct={product}
                    isOpenCartItemUpdateModel={isOpenCartItemUpdateModel}
                    frontSetting={frontSetting}
                />
            )}
            {cashPayment && (
                <CashPaymentModel
                    cashPayment={cashPayment}
                    totalQty={totalQty}
                    cartItemValue={cartItemValue}
                    onChangeInput={onChangeInput}
                    onPaymentStatusChange={onPaymentStatusChange}
                    cashPaymentValue={cashPaymentValue}
                    allConfigData={allConfigData}
                    subTotal={subTotal}
                    onPaymentTypeChange={onPaymentTypeChange}
                    grandTotal={grandTotal}
                    onCashPayment={onCashPayment}
                    taxTotal={taxTotal}
                    handleCashPayment={handleCashPayment}
                    settings={settings}
                    errors={errors}
                    paymentTypeDefaultValue={paymentTypeDefaultValue}
                    paymentTypeFilterOptions={paymentTypeFilterOptions}
                    onChangeReturnChange={onChangeReturnChange}
                    setPaymentValue={setPaymentValue}
                />
            )}
            {lgShow && (
                <RegisterDetailsModel printRegisterDetails={printRegisterDetails} frontSetting={frontSetting} lgShow={lgShow} setLgShow={setLgShow} />
            )}
            {holdShow && (
                <HoldListModal
                    setUpdateHoldList={setUpdateHoldList}
                    setCartItemValue={setCartItemValue}
                    setUpdateProducts={setUpdateProducts}
                    updateProduct={updateProducts}
                    printRegisterDetails={printRegisterDetails}
                    frontSetting={frontSetting}
                    holdListData={holdListData}
                    setHold_ref_no={setHold_ref_no}
                    holdShow={holdShow}
                    setHoldShow={setHoldShow}
                    addCart={addToCarts}
                    updateCart={updateCart}
                    setSelectedCustomerOption={setSelectedCustomerOption}
                    setSelectedOption={setSelectedOption}
                />
            )}
            {modalShowCustomer && (
                <CustomerForm show={modalShowCustomer} hide={setModalShowCustomer} />
            )}
            <PosCloseRegisterDetailsModel
                showCloseDetailsModal={showCloseDetailsModal}
                handleCloseRegisterDetails={handleCloseRegisterDetails}
                setShowCloseDetailsModal={setShowCloseDetailsModal}
            />
            {allConfigData?.permissions?.length === 1 && (
                <PosRegisterModel showPosRegisterModel={showPosRegisterModel} isCloseButton={false} onClickshowPosRegisterModel={() => setShowPosRegisterModel(false)} />
            )}
        </div>
    );
};

const mapStateToProps = (state) => {
    const { posAllProducts, frontSetting, settings, cashPayment, allConfigData, posAllTodaySaleOverAllReport, holdListData, customers } = state;
    return {
        holdListData,
        posAllProducts,
        frontSetting,
        settings,
        customers,
        paymentDetails: cashPayment,
        customCart: prepareCartArray(posAllProducts),
        allConfigData,
        posAllTodaySaleOverAllReport,
    };
};

export default connect(mapStateToProps, {
    fetchSetting,
    fetchFrontSetting,
    posSearchNameProduct,
    posCashPaymentAction,
    posSearchCodeProduct,
    posAllProduct,
    fetchBrandClickable,
    fetchHoldLists,
    fetchCustomer,
})(PosMainPage);
