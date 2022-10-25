 import { useState, useEffect, useRef } from 'react';

// ! THINGS TO DO 
// ! evaluate need to split up currencyData state object into smaller state objects,
//  ! and see if this impacts Fetch in useEffect
// ! reevaluate my need for keeping track of indices for focus control re select boxes vs filter field
// ! reevaluate the need for gotofilter and focusinselect and their implementation
// ! reevaluate the usage of useEffect and implementation
// ! reevaluate how many times I am calling setCurrecyData and where
// ! rename functions and variables appropriately, evaluate 

 const FetchConstants = {
     baseURL: 'https://openexchangerates.org/api/',
     app_id: '0f6288f8f4b4421ba1a18cf74a5b9dcf'
 }

 function App() {
     // references are utilized for the purpose of managing focus of filters (text input) and the related select boxes only
     // programmatic management necessary due to the implemented feature-set
     const refs = {
         baseFilterRef: useRef(null),
         baseSelectRef: useRef(null),
         convertFilterRef: useRef(null),
         convertSelectRef: useRef(null),
     }

     // starter implementation in search of use state to modulate modal show or hide
     // another way to do this would be use array and identify modals by indices.
     // i.e. modal0 is modal at index 0 and start with an empty array, populate it as we go, 
     // think it through some more but
     // next steps include converting this state variable to such an implementation
     // issues to consider is that index of a particular chart would then change on re-renders if 
     // user removes a convertTo currency
     const [showClickedModal, setShowClickedModal] = useState({
        modal0: false,
        modal1: false,
        modal2: false,
        modal3: false,
        modal4: false,
        modal5: false, 
     })


     const [baseFilterVal, setBaseFilterVal] = useState("");
     const [convertFilterVal, setConvertFilterVal] = useState("");
     const elemAttribs = {
         baseFilter: {
             onKeyUp: handleFilterDownArrow_Base,
             placeholder: "filter",
             onClick: handleBaseFilterClick,
             onChange: handleBaseFilterChange,
             value: baseFilterVal,
         },
         convertFilter: {
             onKeyUp: handleFilterDownArrow_Convert,
             placeholder: "another filter",
             onClick: handleConvertFilterClick,
             onChange: handleConvertFilterChange,
             value: convertFilterVal,
         },
         baseSelect: {
             size: "5",
             onKeyUp: handleSelectSpecialKeyPresses_Base,
             onChange: handleBaseSelectChange,
             className: "Configure-baseSelectBox"
         },
         convertSelect: {
             size: "5",
             onKeyUp: handleSelectSpecialKeyPresses_Convert,
             onChange: handleConvertSelectChange,
             className: "Configure-convertSelectBox"
         }
     }


     const BaseFilter = () => <input ref={refs.baseFilterRef} {...elemAttribs.baseFilter}/>
     const ConvertFilter = () => <input ref={refs.convertFilterRef} {...elemAttribs.convertFilter}/>
     const BaseSelect = () => {
         let thing = Object.keys(currencyData.fullNames).filter(o => baseFilteredVal(o)).map((o, i) => baseCreateOption(o, i));
         return <select ref={refs.baseSelectRef} {...elemAttribs.baseSelect}>{thing}</select>
     }
     const ConvertSelect = () => {
         let options = Object.keys(currencyData.fullNames).filter(o => convertToFilteredVal(o)).map((o, i) => convertCreateOption(o, i));
         return <select ref={refs.convertSelectRef} {...elemAttribs.convertSelect}>{options}</select>
     }

    // this might be less hassle if I break this into 3 or 4 different state variables, or at least 2.
     const [currencyData, setcurrencyData] = useState({
         convertFrom: 'USD',
         convertTo: ['EUR', 'GBP', 'CNY', 'BGN', 'AED'],
         rates: {},
         fullNames: {},
     });

     const [focusInSelect, setFocusInSelect] = useState({
         base: false,
         convert: false,
     });

     const [goToFilter, setGoToFilter] = useState({
         base: false,
         convert: false,
     });

     const [prevBaseSelectIx, setPrevBaseSelectIx] = useState(-1);
     const [prevConvertSelectIx, setPrevConvertSelectIx] = useState(-1);
     
     const [goToBaseFilter, setGoToBaseFilter] = useState(false);
     const [goToConvertFilter, setGoToConvertFilter] = useState(false);

     // note 10/24--- as of the current state of the app, this below useEffect call cannot use currencyData as a dependency, it will be called too frequently
     useEffect(fetchAll, []);

     // clean this up, define functions for these, comb and weed unnecessary code

     useEffect(() => {
         if (focusInSelect.base) {
             refs.baseSelectRef.current.focus();
             refs.baseSelectRef.current.selectedIndex = 0;
         } else if (focusInSelect.convert) {
             refs.convertSelectRef.current.focus();
             refs.convertSelectRef.current.selectedIndex = 0;
         } else { return undefined };
     }, [focusInSelect]);

     useEffect(() => {
         if (goToFilter.base) {
             refs.baseFilterRef.current.focus();
             refs.baseSelectRef.current.blur();
             refs.baseSelectRef.current.selectedIndex = -1;
             let arg1 = { ...goToFilter, base: false }
             setGoToFilter(arg1);
             let arg2 = { ...focusInSelect, base: false, convert: false };
             setFocusInSelect(arg2);
             // })()
         } else if (goToFilter.convert) {
             (() => {
                 refs.convertFilterRef.current.focus();
                 refs.convertSelectRef.current.blur();
                 refs.convertSelectRef.current.selectedIndex = -1;
                 let arg1 = { ...goToFilter, convert: false };
                 setGoToFilter(arg1);
                 let arg2 = { ...focusInSelect, base: false, convert: false };
                 setFocusInSelect(arg2);
             })()
         }
     }, [goToFilter]);


     // APP METHODS are temporarily defined below the return block for development purposes
     return (
         // prevent default behavior of refresh of browser page when enter key is pressed in any/all input field
         <div className="Page" onKeyDown={(e)=>e.keyCode === 13 ? e.preventDefault() : undefined}>
    <header className="Header">
        <p>{currencyData.convertFrom}</p>
        <div>
            {currencyData.convertTo.map((o,i)=><p key={i}>{o}</p>)}
        </div>
    </header>
    <div className="Configure">
        <div className="Configure-Base-Left">
        <p> change your base currency from <span style={{background:"black",color:"white",fontWeight:"bold"}}>{currencyData.convertFrom}</span> </p>
            <form>
            <label>FILTER
                {BaseFilter()}
            </label>
            </form>
            {BaseSelect()}
        </div>
        <div className="Configure-Convert-Right">
        <p> select {"<="} 5 currencies to compare </p>
            <form>
            <label>FILTER
                {ConvertFilter()} 
              </label>
            </form>
            {ConvertSelect()}
        </div>
    </div>
    <main className="ChartContent">
    <div className="ChartContent-chartsContainer">
    {makeCharts()}
    </div>
    </main>
    <footer className="Footer">&copy; 2022 Joachim Byrnes-Shay</footer>
</div>
     )
     // APP METHODS ARE BELOW
     // many INITIAL TWEAKS AND TODOS pending to include:
     // 1. if filter doesn't yield any results,
     // up or down arrow should provide same functionality as clicking in filter field as if to edit, but currently does not
     // 2. up arrow back into filter field results in 2 positions- first at end of string, second at start of string on an additionao 'up'- probably normalize this so only one possibliity
     // 3. start changing the state of the data upon user UI control appropriately
     // 4. visual design and color
     // 5. charts
     // 6. 2nd select and filter set for currency conversions TO
     // 7. etc

     function baseFilteredVal(o) {
         return o.toLowerCase().startsWith(baseFilterVal.toLowerCase());
     }

     function baseCreateOption(o, i) {
         return <option value={o} key={i} onClick={(e)=>handleOptionClick_base(o,e)}>{o}: {currencyData.fullNames[o]}</option>
     }

     function convertToFilteredVal(o) {
         let val = o.toLowerCase().startsWith(convertFilterVal.toLowerCase());
         return val && (o.toLowerCase() !== currencyData.convertFrom.toLowerCase());
     }

     function convertCreateOption(o, i) {
         return <option value={o} key={i} onClick={(e)=>handleOptionClick_convert(o,e)}>{o}: {currencyData.fullNames[o]}</option>
     }

     function handleSelectSpecialKeyPresses_Base(e) {
         // if up arrow pressed and at first index of list already, restore focus to filter field
         // this allows a smooth user experience of if using up arrow to scroll upward through select list,
         // user "pops" into filter field after scrolling up past option 0
         let currentIndex = e.target.selectedIndex;
         if (e.keyCode === 38) {
             console.log('yes its 38');
             (prevBaseSelectIx === 0) ? setGoToFilter({ ...goToFilter, base: true, convert: false }): setPrevBaseSelectIx(currentIndex);

         } else if (e.key === 'Enter') {
             // when the enter key is pressed on an option, set the "currency to convert from" to the selected option
             let val = refs.baseSelectRef.current.options[refs.baseSelectRef.current.selectedIndex].value;

             console.log(currencyData.convertFrom);
             let argu = { ...currencyData, convertFrom: val };
             setcurrencyData(argu);
         }
     }

     function handleSelectSpecialKeyPresses_Convert(e) {
         let currentIndex = e.target.selectedIndex;
         let val = e.target.value;
         if (e.keyCode === 38) {

             (prevConvertSelectIx === 0) ? setGoToFilter({ ...goToFilter, convert: true, base: false }): setPrevConvertSelectIx(currentIndex);

         } else if (e.key === 'Enter') {
             let newArr;
             let val = refs.convertSelectRef.current.options[refs.convertSelectRef.current.selectedIndex].value;
             if (currencyData.convertTo.includes(val)) {
                 let ix = currencyData.convertTo.indexOf(val);
                 console.log(ix);
                 let endIx = currencyData.convertTo.length - 1;
                 let leftArr = currencyData.convertTo.slice(0, ix);
                 let rightArr = currencyData.convertTo.slice(ix + 1, endIx + 1);
                 newArr = [...leftArr, ...rightArr];
             } else {
                 newArr = [...currencyData.convertTo, val]
             }
             setcurrencyData({ ...currencyData, convertTo: newArr })
         }
     }



     function handleFilterDownArrow_Base(e) {
         // if down arrow pressed while in filter field, set focus to select box below it
         // part II of providing the user an up/down scrollable unit consisting of both filter field and select options list combined
         let currentIndex = e.target.selectedIndex;
         if (e.keyCode === 40) {
             console.log('yes its code 40');
             console.log("this is focusInSelect :\n", focusInSelect);
             if (!focusInSelect.base) {
                 let arg = { ...focusInSelect, base: true, convert: false };
                 setFocusInSelect(arg);
             };
             setPrevBaseSelectIx(currentIndex);
         }
     }

     function handleFilterDownArrow_Convert(e) {
         let currentIndex = e.target.selectedIndex;
         if (e.keyCode === 40) {
             console.log('yes its code 40');
             console.log(focusInSelect);
             if (!focusInSelect.convert) {
                 let arg = { ...focusInSelect, convert: true, base: false };
                 setFocusInSelect(arg);
             }
             setPrevConvertSelectIx(currentIndex);
         }
     }

     function handleBaseFilterClick(e) {
         // if user uses mouse control to travel to and click into the filter field from any distance, instead of using up/down to scroll,
         // reset focus of filter field to "true" and select box to "false" to induce working desired feature set in cooperation with the other tweaks
         // since selectedIndex is manually set in cooperating functions, manually unset with -1 value here
         refs.baseFilterRef.current.focus();
         refs.baseSelectRef.current.selectedIndex = -1;
         refs.convertSelectRef.current.selectedIndex = -1;
         setGoToFilter({ ...goToFilter, base: true, convert: false });
     }

     function handleConvertFilterClick(e) {
         refs.convertFilterRef.current.focus();
         refs.convertSelectRef.current.selectedIndex = -1;
         refs.baseSelectRef.current.selectedIndex = -1;
         let arg = { ...goToFilter, convert: true, base: false };
         setGoToFilter(arg);
     }

     function fetchAll() {
         let baseRates = `latest.json?app_id=${FetchConstants.app_id}&base='${currencyData.convertFrom}'`;
         let baseSubURLfullNames = 'currencies.json';
         let ratesURL = FetchConstants.baseURL + baseRates;
         let namesURL = FetchConstants.baseURL + baseSubURLfullNames;
         fetch(namesURL).then(response => response.json())
            .then((namesData) => {
                 fetch(ratesURL).then(response => response.json())
                     .then(ratesResults => {
                         setcurrencyData({ ...currencyData, rates: ratesResults.rates, fullNames: namesData });
                     })
             });
     }

     function handleBaseFilterChange(thisFilter) {
         // the filter field input, used as new value in JSX upon changes
         let val = thisFilter.target.value;
         setBaseFilterVal(val);
     }

     function handleConvertFilterChange(thisFilter) {
         let val = thisFilter.target.value;
         setConvertFilterVal(val);
     }

     function handleOptionClick_base(optionVal, e) {
         // console.log(e.target.textContent);
         // if double-left click on an option, we want to use selection of this option to set a new convertFrom value (i.e. e.detail val is the consecutive num of left clicks)
         // design decision--- on double click, but NOT on single click, which potentially may be employed by user as part of the navigation process without other intentions

         //cannot currently do the below because it sets the selected index to 0 which is incorrect if clicking into the option directly via mouseover from another element/location on the page.
         let ix = refs.baseSelectRef.current.selectedIndex;
         setPrevBaseSelectIx(ix);
         console.log('clicked on option: ', focusInSelect);
         if (e.detail === 2) {
             setcurrencyData({ ...currencyData, convertFrom: optionVal })
         }
     }

     function handleOptionClick_convert(optionVal, e) {
         let ix = refs.convertSelectRef.current.selectedIndex;
         setPrevConvertSelectIx(ix);
         if (e.detail === 2) {
             let newArr;
             let val = optionVal;
             if (currencyData.convertTo.includes(val)) {
                 let ix = currencyData.convertTo.indexOf(val);
                 console.log(ix);
                 let endIx = currencyData.convertTo.length - 1;
                 let leftArr = currencyData.convertTo.slice(0, ix);
                 let rightArr = currencyData.convertTo.slice(ix + 1, endIx + 1);
                 newArr = [...leftArr, ...rightArr];
             } else {
                 newArr = [...currencyData.convertTo, val]
             }
             setcurrencyData({ ...currencyData, convertTo: newArr })
         }
     }
     // not sure if we need to check onChange on select with the current implementation above, ok without using it so far in Firefox, check Chrome, Edge, etc browsers
     function handleBaseSelectChange(thisSelect) {
         let val = thisSelect.target.value;
     }

     function handleConvertSelectChange(thisSelect) {
         let val = thisSelect.target.value;
     }

     function makeCharts() {

         let workingArr = [currencyData.convertFrom, ...currencyData.convertTo]
         let max = currencyData.convertFrom;
         workingArr.forEach(e => {
             if (parseFloat(currencyData.rates[e]) > parseFloat(currencyData.rates[max])) {
                 max = e;
             }
         });

         let divs = workingArr.map((e,ix) => {
             let height = parseFloat(currencyData.rates[e]) / parseFloat(currencyData.rates[max]) * 100;
             let attribs = {
                 onClick: ()=>hiModal(ix),
                 onMouseOut: showClickedModal[`modal${ix}`] ? ()=>byeModal(ix) : null,
                 style: {
                     background: "green",
                     width: "10%",
                     display: "inline-block",
                     height: String(height) + '%',
                 },
                 //"data-modalcontainer": `modal${ix}`,
                 className: showClickedModal[`modal${ix}`] ? `showIt-${ix}` : null,
                 
             }
             return (<div {...attribs}>{e}<div className="thisModal">{e}</div></div>)
         });

         return divs;
     }


     function hiModal(ix) {
        let modalName = `modal${ix}`;
        setShowClickedModal({...showClickedModal, [modalName]: !showClickedModal[modalName]});

     }

     function byeModal(ix) {
        let modalName = `modal${ix}`;
        console.log(`moved off of modal${ix}`, " modal name is ", modalName);
        setShowClickedModal({...showClickedModal, [modalName]: false});
     }
 }
 export default App;