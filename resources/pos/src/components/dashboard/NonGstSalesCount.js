import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFileInvoice,
    faCalendarDay,
    faMoneyBill,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import apiConfig from "../../config/apiConfig";
import { apiBaseURL } from "../../constants";
import { getFormattedMessage } from "../../shared/sharedMethod";
import Widget from "../../shared/Widget/Widget";

// Non-GST sales are kept apart from GST sales, so they get their own row of cards.
const NonGstSalesCount = (props) => {
    const { frontSetting, config, allConfigData } = props;
    const [counts, setCounts] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        apiConfig
            .get(apiBaseURL.NON_GST_SALES_COUNT)
            .then((response) => setCounts(response.data.data || {}))
            .catch(() => setCounts({}));
    }, []);

    const canOpenList =
        config && config.filter((item) => item === "manage_sale").length !== 0;
    const onClick = () => canOpenList && navigate("/app/non-gst-sales");
    const currency = frontSetting.value && frontSetting.value.currency_symbol;
    const amount = (value) => (value ? parseFloat(value).toFixed(2) : "0.00");

    const cards = [
        { title: "dashboard.non-gst.sales", value: counts.all_sales, icon: faFileInvoice, iconClass: "bg-yellow-300" },
        { title: "dashboard.non-gst.today-sales", value: counts.today_sales, icon: faCalendarDay, iconClass: "bg-yellow-300" },
        { title: "dashboard.non-gst.received", value: counts.all_received, icon: faMoneyBill, iconClass: "bg-yellow-300" },
        { title: "dashboard.non-gst.returns", value: counts.all_returns, icon: faArrowRight, iconClass: "bg-yellow-300" },
    ];

    return (
        <Row className="g-4">
            <Col className="col-12 mb-4">
                <h4 className="mb-0">{getFormattedMessage("non-gst-sales.title")}</h4>
                <Row>
                    {cards.map((card) => (
                        <Widget
                            key={card.title}
                            title={getFormattedMessage(card.title)}
                            onClick={onClick}
                            allConfigData={allConfigData}
                            className={`bg-warning ${canOpenList ? "cursor-pointer" : ""}`}
                            iconClass={card.iconClass}
                            icon={<FontAwesomeIcon icon={card.icon} className="fs-1-xl text-white" />}
                            currency={currency}
                            value={amount(card.value)}
                        />
                    ))}
                </Row>
            </Col>
        </Row>
    );
};

const mapStateToProps = (state) => {
    const { config, allConfigData } = state;
    return { config, allConfigData };
};

export default connect(mapStateToProps)(NonGstSalesCount);
