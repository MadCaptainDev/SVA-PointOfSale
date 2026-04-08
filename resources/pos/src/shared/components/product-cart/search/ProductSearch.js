import React, {useState} from 'react';
import {connect, useDispatch} from 'react-redux';
import {ReactSearchAutocomplete} from 'react-search-autocomplete';
import {addToast} from '../../../../store/action/toastAction';
import {toastType} from '../../../../constants';
import {searchPurchaseProduct} from '../../../../store/action/purchaseProductAction';
import {getFormattedMessage, placeholderText} from '../../../sharedMethod';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch} from "@fortawesome/free-solid-svg-icons";

const ProductSearch = (props) => {
    const {
        values,
        products,
        updateProducts,
        setUpdateProducts,
        customProducts,
        searchPurchaseProduct,
        handleValidation,
        isAllProducts
    } = props;
    const [searchString, setSearchString] = useState("");
    const dispatch = useDispatch();
    const filterProducts = isAllProducts && values.warehouse_id ? products.map((item) => ({
        name: item.attributes.name, code: item.attributes.code, id: item.id
    })) : values.warehouse_id && products.filter((qty) => qty && qty.attributes && qty.attributes.stock && qty.attributes.stock.quantity > 0).map((item) => ({
        name: item.attributes.name, code: item.attributes.code, id: item.id
    }))

const onProductSearch = (code) => {
    if (!values.warehouse_id) {
        handleValidation();
        return;
    }

    setSearchString(code);

    const matchedProductData = products.find(
        (item) => item.attributes.code === code || item.attributes.code === code.code
    );

    if (!matchedProductData) {
        console.log("❌ Product not found in 'products' by code:", code);
        return;
    }

    const matchedId = matchedProductData.id;

    const matchedProduct = customProducts.find(
        (item) => item.product_id === matchedId
    );

    if (!matchedProduct) {
        console.log("❌ Product not found in 'customProducts' with product_id:", matchedId);
        return;
    }
    
    console.log('matched:' ,customProducts[0]);

    if (updateProducts.find((p) => p.product_id === matchedId)) {
        dispatch(addToast({
            text: getFormattedMessage('globally.product-already-added.validate.message'),
            type: toastType.ERROR
        }));
    } else {
       const updatedProduct = {
    ...matchedProduct,
    product_price:
        matchedProduct.product_price ??
        matchedProduct.net_unit_cost ??
        matchedProduct.product_cost ??
        0
};

        setUpdateProducts((prev) => [...prev, updatedProduct]);
        console.log("✅ Product added to updateProducts:", updatedProduct);
    }

    removeSearchClass();
    setSearchString("");
};


    const handleOnSearch = (string) => {
        onProductSearch(string);
    }

    const handleOnSelect = (result) => {
        onProductSearch(result);
    }

    const formatResult = (item) => {
        return (
            <span onClick={(e) => e.stopPropagation()}>{item.code} ({item.name})</span>
        )
    }

    const removeSearchClass = () => {
        const html = document.getElementsByClassName(`custom-search`)[0].firstChild.firstChild.lastChild;
        html.style.display = 'none'
    }

    return (
        <div className='position-relative custom-search'>
            <ReactSearchAutocomplete
                items={filterProducts}
                onSearch={handleOnSearch}
                inputSearchString={searchString}
                fuseOptions={{keys: ['code', 'name']}}
                resultStringKeyName='code'
                placeholder={placeholderText('globally.search.field.label')}
                onSelect={handleOnSelect}
                formatResult={formatResult}
                showIcon={false}
                showClear={false}
            />
            <FontAwesomeIcon icon={faSearch}
                             className='d-flex align-items-center top-0 bottom-0 react-search-icon my-auto text-gray-600 position-absolute'/>
        </div>
    );
}

export default connect(null, {searchPurchaseProduct})(ProductSearch);
