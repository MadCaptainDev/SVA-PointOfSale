import React from "react";
import { getFormattedMessage } from "../../shared/sharedMethod";

const Footer = (props) => {
    const { allConfigData, frontSetting } = props;
    return (
        <footer className="border-top w-100 pt-4 mt-7 d-flex justify-content-between">
            <p className="fs-6 text-gray-600">
               
                <a href="https://chakragroups.in" className="text-decoration-none">
                   Powered By Chakra App Studio
                    
                </a>
            </p>
            <div className="fs-6 text-gray-600">
                {allConfigData && allConfigData.is_version === "1"
                    ? "v" + allConfigData.version
                    : ""}
            </div>
        </footer>
    );
};

export default Footer;
