import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row, Table, Button, Modal } from "react-bootstrap-v5";
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
import CartEmptyState from "./cart-product/CartEmptyState";
import PosHeader from "./header/PosHeader";
import { posCashPaymentAction } from "../../store/action/pos/posCashPaymentAction";
import PaymentButton from "./cart-product/PaymentButton";
import CashPaymentModel from "./cart-product/paymentModel/CashPaymentModel"; // kept for backward compat
import InlinePaymentPanel from "./cart-product/InlinePaymentPanel";
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
    // const [play] = useSound('https://s3.amazonaws.com/freecodecamp/drums/Heater-4_1.mp3');
    const [openCalculator, setOpenCalculator] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [updateProducts, setUpdateProducts] = useState([]);
    const [isOpenCartItemUpdateModel, setIsOpenCartItemUpdateModel] =
        useState(false);
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
        discount_type: discountType.FIXED,    // 0 = fixed, 1 = percentage
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
    // const [searchString, setSearchString] = useState('');
    const [changeReturn, setChangeReturn] = useState(0);
    const [showCloseDetailsModal, setShowCloseDetailsModal] = useState(false);
    const [showPosRegisterModel, setShowPosRegisterModel] = useState(false)
    const { closeRegisterDetails } = useSelector((state) => state);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    //total Qty on cart item
    const totalQty = React.useMemo(() => {
        const localCart = updateProducts.map((updateQty) =>
            Number(updateQty.quantity)
        );
        return localCart.length > 0 ?
            localCart.reduce((cart, current) => cart + current, 0) : 0;
    }, [updateProducts]);

    //subtotal on cart item
    const subTotal = React.useMemo(() => {
        const localTotal = updateProducts.map(
            (updateQty) =>
                calculateProductCost(updateQty).toFixed(2) * updateQty.quantity
        );
        return localTotal.length > 0 ?
            localTotal.reduce((cart, current) => cart + current, 0) : 0;
    }, [updateProducts]);

    const [holdListId, setHoldListValue] = useState({
        referenceNumber: "",
    });

    //grand total on cart item
    const { taxTotal, grandTotal } = React.useMemo(() => {
        const discountTotal = subTotal - cartItemValue.discount;
        const taxTotal = (discountTotal * cartItemValue.tax) / 100;
        const mainTotal = discountTotal + taxTotal;
        const grandTotal = Math.round(
            Number(mainTotal) + Number(cartItemValue.shipping) - Number(cartItemValue.point_discount)
        );
        return { taxTotal, grandTotal };
    }, [subTotal, cartItemValue.discount, cartItemValue.point_discount, cartItemValue.tax, cartItemValue.shipping]);

    const { userProfile } = useSelector((state) => state);

    useEffect(() => {
        setSelectedCustomerOption(
            settings.attributes && {
                value: Number(settings.attributes.default_customer),
                label: settings.attributes.customer_name,
            }
        );
        setSelectedOption(
            settings.attributes && {
                value: Number(settings.attributes.default_warehouse),
                label: settings.attributes.warehouse_name,
            }
        );
    }, [settings]);

    useEffect(() => {
        if (selectedCustomerOption) {
            const customerId = selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value);
            if (customerId) {
                fetchCustomer(customerId, false);
            }
        }
    }, [selectedCustomerOption]);

    useEffect(() => {
        fetchSetting();
        fetchFrontSetting();
        fetchTodaySaleOverAllReport();
        fetchHoldLists();
    }, []);

    useEffect(() => {
        if (allConfigData) {
            setShowPosRegisterModel(allConfigData?.open_register)
        }
    }, [allConfigData])

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
        if (
            cashPaymentValue["notes"] &&
            cashPaymentValue["notes"].length > 100
        ) {
            errors["notes"] =
                "The notes must not be greater than 100 characters";
        } else {
            isValid = true;
        }
        setErrors(errors);
        return isValid;
    };

    //filter on category id
    const setCategory = (item) => {
        setCategoryId(item);
    };

    useEffect(() => {
        if (selectedOption) {
            fetchBrandClickable(
                brandId,
                categoryId,
                selectedOption.value && selectedOption.value
            );
        }
    }, [selectedOption, brandId, categoryId]);

    //filter on brand id
    const setBrand = (item) => {
        setBrandId(item);
    };

    const onChangeInput = (e) => {
        e.preventDefault();
        setCashPaymentValue((inputs) => ({
            ...inputs,
            [e.target.name]: e.target.value,
        }));
    };

    const onPaymentStatusChange = (obj) => {
        setCashPaymentValue((inputs) => ({ ...inputs, payment_status: obj }));
    };

    const onChangeReturnChange = (change) => {
        setChangeReturn(change);
    };

    // payment type dropdown functionality
    const paymentTypeFilterOptions = getFormattedOptions(paymentMethodOptions);
    const paymentTypeDefaultValue = paymentTypeFilterOptions.map((option) => {
        return {
            value: option.id,
            label: option.name,
        };
    });
    const [paymentValue, setPaymentValue] = useState({
        payment_type: paymentTypeDefaultValue[0],
    });

    const onPaymentTypeChange = (obj) => {
        setPaymentValue({ ...paymentValue, payment_type: obj });
    };

    const onChangeCart = (event) => {
        if (updateProducts.length == 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cash-payment.product-error.message"), type: toastType.ERROR }))
            return;
        }
        const { value } = event.target;
        // check if value includes a decimal point
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            // restrict value to only 2 decimal places
            if (decimal?.length > 2) {
                // do nothing
                return;
            }
        }

        let discount = cartItemValue.discount;
        if (event.target.name == 'discount_value') {
            if (cartItemValue.discount_type == discountType.FIXED) {
                discount = value;
            } else {
                discount = (Number(subTotal) * Number(value)) / 100;
            }
        }
        if (event.target.name === 'discount_type') {
            if (value == discountType.FIXED) {
                discount = cartItemValue.discount_value;
            } else {
                discount = (Number(subTotal) * Number(cartItemValue.discount_value)) / 100;
            }
        }

        let pointDiscount = cartItemValue.point_discount;
        if (event.target.name === 'redeem_points') {
            const points = value;
            const rate = settings.attributes && settings.attributes.point_redemption_rate ? settings.attributes.point_redemption_rate : 0;
            pointDiscount = points * rate;
        }

        setCartItemValue((inputs) => ({
            ...inputs,
            discount: discount,
            point_discount: pointDiscount,
            [event.target.name]: value,
        }));
    };

    const onChangeTaxCart = (event) => {
        if (updateProducts.length == 0) {
            dispatch(addToast({ text: getFormattedMessage("pos.cash-payment.product-error.message"), type: toastType.ERROR }))
            return;
        }
        const min = 0;
        const max = 100;
        const { value } = event.target;
        const values = Math.max(min, Math.min(max, Number(value)));
        // check if value includes a decimal point
        if (value.match(/\./g)) {
            const [, decimal] = value.split(".");
            // restrict value to only 2 decimal places
            if (decimal?.length > 2) {
                // do nothing
                return;
            }
        }
        setCartItemValue((inputs) => ({
            ...inputs,
            [event.target.name]: values,
        }));
    };

    //payment slip model onchange
    const handleCashPayment = () => {
        setCashPaymentValue({
            notes: "",
            payment_status: {
                label: getFormattedMessage("dashboard.recentSales.paid.label"),
                value: 1,
            },
        });
        setCashPayment(!cashPayment);
    };

    const updateCost = (item) => {
        setNewCost(item);
    };

    //product details model onChange
    const openProductDetailModal = () => {
        setIsOpenCartItemUpdateModel(!isOpenCartItemUpdateModel);
    };

    //product details model updated value
    const onClickUpdateItemInCart = (item) => {
        setProduct(item);
        setIsOpenCartItemUpdateModel(true);
    };

    const onProductUpdateInCart = () => {
        const localCart = updateProducts.slice();
        updateCart(localCart);
    };

    //updated Qty function
    const updatedQty = (qty) => {
        setQuantity(qty);
    };

    const updateCart = (cartProducts) => {
        setUpdateProducts(cartProducts);
    };

    //cart item delete
    const onDeleteCartItem = (productId) => {
        const existingCart = updateProducts.filter((e) => e.id !== productId);
        updateCart(existingCart);
    };

    //product add to cart function
    const addToCarts = (items) => {
        updateCart(items);
    };

    // create customer model
    const customerModel = (val) => {
        setModalShowCustomer(val);
    };

    //prepare data for print Model
    const preparePrintData = () => {
        const formValue = {
            products: updateProducts,
            discount: cartItemValue.discount ? cartItemValue.discount : 0,
            tax: cartItemValue.tax ? cartItemValue.tax : 0,
            cartItemPrint: cartItemValue,
            taxTotal: taxTotal,
            grandTotal: grandTotal,
            shipping: cartItemValue.shipping,
            subTotal: subTotal,
            frontSetting: frontSetting,
            customer_name: selectedCustomerOption,
            customer: customers && customers.find(c => c.id === (selectedCustomerOption && (selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value)))),
            settings: settings,
            note: cashPaymentValue.notes,
            changeReturn,
            payment_status: cashPaymentValue.payment_status,
        };
        return formValue;
    };

    //prepare data for payment api
    const prepareData = (updateProducts) => {
        const formValue = {
            date: moment(new Date()).format("YYYY-MM-DD"),
            customer_id:
                selectedCustomerOption && selectedCustomerOption[0]
                    ? selectedCustomerOption[0].value
                    : selectedCustomerOption && selectedCustomerOption.value,
            warehouse_id:
                selectedOption && selectedOption[0]
                    ? selectedOption[0].value
                    : selectedOption && selectedOption.value,
            sale_items: updateProducts,
            grand_total: grandTotal,
            ...(cashPaymentValue?.payment_status?.value === 1
                ? { payment_type: paymentValue?.payment_type?.value }
                : {}),
            discount: cartItemValue.discount,
            point_discount: cartItemValue.point_discount,
            redeem_points: cartItemValue.redeem_points,
            shipping: cartItemValue.shipping,
            tax_rate: cartItemValue.tax,
            note: cashPaymentValue.notes,
            status: 1,
            hold_ref_no: hold_ref_no,
            payment_status: cashPaymentValue?.payment_status?.value,
        };
        return formValue;
    };

    //cash payment method
    const onCashPayment = (event, printSlip = false) => {
        event.preventDefault();
        const valid = handleValidation();
        if (valid) {
            posCashPaymentAction(
                prepareData(updateProducts),
                setUpdateProducts,
                setModalShowPaymentSlip,
                posAllProduct,
                {
                    brandId,
                    categoryId,
                    selectedOption,
                }, printSlip
            );
            // setModalShowPaymentSlip(true);
            setCashPayment(false);
            setPaymentPrint(preparePrintData());
            setCartItemValue({
                discount_type: discountType.FIXED,
                discount_value: 0,
                discount: 0,
                tax: 0,
                shipping: 0,
                point_discount: 0,
                redeem_points: 0,
            });
            setCashPaymentValue({
                notes: "",
                payment_status: {
                    label: getFormattedMessage(
                        "dashboard.recentSales.paid.label"
                    ),
                    value: 1,
                },
            });
            setCartProductIds("");
        }
    };

    const loadUserNameSection = () => {
        const firstName = userProfile?.attributes?.first_name || '';
        const lastName = userProfile?.attributes?.last_name || '';

        console.log(firstName);

        return (
            <div className="d-none" id="user-name-print">
                <h4>
                    User Name: {firstName} {lastName}
                </h4>
            </div>
        );
    };

    const printPaymentReceiptPdf = () => {
        document.getElementById("printReceipt").click();
    };

    const printRegisterDetails = () => {
        document.getElementById("printRegisterDetailsId").click();
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    const handleRegisterDetailsPrint = useReactToPrint({
        content: () => registerDetailsRef.current,
    });

    //payment print
    const loadPrintBlock = () => {
        return (
            <div className="d-none">
                <button id="printReceipt" onClick={handlePrint}>
                    Print this out!
                </button>
                <PrintData
                    ref={componentRef}
                    paymentType={paymentValue.payment_type.label}
                    allConfigData={allConfigData}
                    updateProducts={paymentPrint}
                    paymentDetails={paymentDetails}
                />
            </div>
        );
    };


    const loadRegisterDetailsPrint = () => {
        return (
            <div className="d-none">
                <button
                    id="printRegisterDetailsId"
                    onClick={handleRegisterDetailsPrint}
                >
                    Print this out!
                </button>
                <PrintRegisterDetailsData
                    ref={registerDetailsRef}
                    allConfigData={allConfigData}
                    frontSetting={frontSetting}
                    posAllTodaySaleOverAllReport={posAllTodaySaleOverAllReport}
                    updateProducts={paymentPrint}
                    closeRegisterDetails={closeRegisterDetails}
                />
            </div>
        );
    };

    //payment slip
    const loadPaymentSlip = () => {
        return (
            <div className="d-none">
                <PaymentSlipModal
                    printPaymentReceiptPdf={printPaymentReceiptPdf}
                    setPaymentValue={setPaymentValue}
                    setModalShowPaymentSlip={setModalShowPaymentSlip}
                    settings={settings}
                    frontSetting={frontSetting}
                    modalShowPaymentSlip={modalShowPaymentSlip}
                    allConfigData={allConfigData}
                    paymentDetails={paymentDetails}
                    updateProducts={paymentPrint}
                    paymentType={paymentValue.payment_type.label}
                    paymentTypeDefaultValue={paymentTypeDefaultValue}
                />
            </div>
        );
    };



    const [isDetails, setIsDetails] = useState(null);
    const [lgShow, setLgShow] = useState(false);
    const [holdShow, setHoldShow] = useState(false);

    const onClickDetailsModel = (isDetails = null) => {
        setLgShow(true);
    };

    const onClickHoldModel = (isDetails = null) => {
        setHoldShow(true);
    };

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    const renderSearchAndButtons = () => (
        <div className="d-sm-flex align-items-center flex-xxl-nowrap flex-wrap mb-3">
            <ProductSearchbar
                customCart={customCart}
                setUpdateProducts={setUpdateProducts}
                updateProducts={updateProducts}
                selectedOption={selectedOption}
                settings={settings}
            />
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
    );

    const handleClickCloseRegister = () => {
        dispatch(getAllRegisterDetailsAction());
        setShowCloseDetailsModal(true);
    };

    const handleCloseRegisterDetails = (data) => {
        if (data.cash_in_hand_while_closing.toString().trim()?.length === 0) {
            dispatch(
                addToast({
                    text: getFormattedMessage(
                        "pos.cclose-register.enter-total-cash.message"
                    ),
                    type: toastType.ERROR,
                })
            );
        } else {
            setShowCloseDetailsModal(false);
            dispatch(closeRegisterAction(data, navigate));
        }
    };

    return (
        <Container className="pos-screen px-3 mt-3" fluid>
            <TabTitle title="POS" />
            {loadPrintBlock()}
            {loadPaymentSlip()}
            {loadRegisterDetailsPrint()}
            <Row>
                <TopProgressBar />
                <Col lg={12} className="pos-left-scs">
                    <div className="d-flex flex-column h-100 pb-5">
                        
                        {/* Topbar */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h1 className="fs-4 fw-bold mb-1 col-12 text-dark">New Sale</h1>
                                <div className="text-muted-custom small">
                                    Cashier: {userProfile?.attributes?.first_name || 'Admin'}
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <div className="bg-white border border-line rounded-3 px-3 py-2 d-flex align-items-center gap-2 small text-muted-custom">
                                    <i className="bi bi-clock"></i> <strong className="text-dark">{moment().format('DD MMM YYYY, hh:mm A')}</strong>
                                </div>
                                <button
                                    className="btn btn-modern btn-ghost d-flex align-items-center gap-2"
                                    onClick={() => setIsProductModalOpen(true)}
                                >
                                    <i className="bi bi-grid" /> 
                                    Browse Products
                                </button>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="row g-3">
                                <div className="col-lg-8 d-flex flex-column gap-3">
                                    
                                    {/* Add Item / Search */}
                                    <div className="card-modern p-4">
                                        <div className="card-title-modern mb-3 d-flex justify-content-between align-items-center">
                                            <span>Add Item</span>
                                            <div style={{width:'auto'}}><PosHeader
                                                setSelectedCustomerOption={setSelectedCustomerOption}
                                                selectedCustomerOption={selectedCustomerOption}
                                                setSelectedOption={setSelectedOption}
                                                selectedOption={selectedOption}
                                                customerModel={customerModel}
                                                updateCustomer={modalShowCustomer}
                                            /></div>
                                        </div>
                                        <div className="w-100">
                                             {renderSearchAndButtons()}
                                        </div>
                                    </div>

                                    {/* Cart Items */}
                                    <div className="card-modern p-4">
                                        <div className="card-title-modern mb-3">Cart Items</div>
                                        <Table className="table table-modern table-borderless mb-0 w-100">
                                            <thead className="position-sticky top-0">
                                                <tr>
                                                    <th className="py-3 text-start">#</th>
                                                    <th className="py-3 text-start">{getFormattedMessage("pos-product.title")}</th>
                                                    <th className="py-3 text-start">{getFormattedMessage("pos-qty.title")}</th>
                                                    <th className="py-3 text-start">{getFormattedMessage("pos-price.title")}</th>
                                                    <th className="py-3 text-end" colSpan="2">{getFormattedMessage("pos-sub-total.title")}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-0">
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
                                                            settings={settings}
                                                        />
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-5 border-0">
                                                            <div className="fs-1 mb-2">🛍️</div>
                                                            <div className="text-muted-custom">No items added yet</div>
                                                            <small className="text-muted-custom">Scan a barcode or search above to begin</small>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Right form: Summary & Payment */}
                                <div className="col-lg-4">
                                    <div className="card-modern p-4">
                                        <div className="card-title-modern mb-3">Order Summary</div>
                                        
                                        <CartItemMainCalculation
                                            totalQty={totalQty}
                                            subTotal={subTotal}
                                            grandTotal={grandTotal}
                                            cartItemValue={cartItemValue}
                                            onChangeCart={onChangeCart}
                                            allConfigData={allConfigData}
                                            frontSetting={frontSetting}
                                            onChangeTaxCart={onChangeTaxCart}
                                            customer={customers && customers.find(c => c.id === (selectedCustomerOption && (selectedCustomerOption.value || (selectedCustomerOption[0] && selectedCustomerOption[0].value))))}
                                        />

                                        <div className="my-2">
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
                                    </div>
                                </div>
                            </div>
                        </div>
                </Col>
            </Row>

            {/* PRODUCT BROWSER MODAL */}
            <Modal show={isProductModalOpen} onHide={() => setIsProductModalOpen(false)} size="xl" scrollable>
                <Modal.Header closeButton className="border-bottom-0 bg-light py-3">
                    <Modal.Title className="fs-5 fw-bold text-dark w-100 pe-4">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-grid-fill text-primary" /> Browse Products
                        </div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4 pt-0">
                    <div className="card-modern p-3 mb-4 sticky-top z-index-1">
                        <ProductSearchbar
                            customCart={customCart}
                            setUpdateProducts={setUpdateProducts}
                            updateProducts={updateProducts}
                            selectedOption={selectedOption}
                            settings={settings}
                        />
                    </div>
                    
                    <div className="card-modern h-100">
                        <div className="p-4 border-bottom border-line pb-2">
                            <Category
                                setCategory={setCategory}
                                brandId={brandId}
                                selectedOption={selectedOption}
                            />
                            <Brands
                                categoryId={categoryId}
                                setBrand={setBrand}
                                selectedOption={selectedOption}
                            />
                        </div>
                        <div className="p-3">
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
                    </div>
                </Modal.Body>
            </Modal>
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
            {/* CashPaymentModel removed — payment is now inline via InlinePaymentPanel */}
            {lgShow && (
                <RegisterDetailsModel
                    printRegisterDetails={printRegisterDetails}
                    frontSetting={frontSetting}
                    lgShow={lgShow}
                    setLgShow={setLgShow}
                />
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
                <CustomerForm
                    show={modalShowCustomer}
                    hide={setModalShowCustomer}
                />
            )}
            <PosCloseRegisterDetailsModel
                showCloseDetailsModal={showCloseDetailsModal}
                handleCloseRegisterDetails={handleCloseRegisterDetails}
                setShowCloseDetailsModal={setShowCloseDetailsModal}
            />
            {allConfigData?.permissions?.length === 1 && <PosRegisterModel showPosRegisterModel={showPosRegisterModel} isCloseButton={false} onClickshowPosRegisterModel={() => setShowPosRegisterModel(false)} />}
        </Container>
    );
};

const mapStateToProps = (state) => {
    const {
        posAllProducts,
        frontSetting,
        settings,
        cashPayment,
        allConfigData,
        posAllTodaySaleOverAllReport,
        holdListData,
        customers,
    } = state;
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
