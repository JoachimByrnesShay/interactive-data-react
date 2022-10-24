 import { useState, useEffect, useRef } from 'react';


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
     // const baseFilterRef = useRef(null);
     // const baseSelectRef = useRef(null);
     // const convertFilterRef = useRef(null);
     // const convertSelectRef = useRef(null);

     const [baseFilterVal, setBaseFilterVal] = useState("");
     const [convertFilterVal, setConvertFilterVal] = useState("");
     const [showThisModal, setShowThisModal] = useState(false);

     const BaseFilter = () => <input ref={refs.baseFilterRef} {...baseFilterAttribs}/>
     const ConvertFilter = () => <input ref={refs.convertFilterRef} {...convertFilterAttribs}/>
     const BaseSelect = ()=> {
        let thing = Object.keys(currencyData.fullNames).filter(o=>baseFilteredVal(o) ).map((o,i)=>baseCreateOption(o,i));
        return <select ref={refs.baseSelectRef} {...baseSelectAttribs}>{thing}</select>
    }
     const ConvertSelect = () => {
        let options = Object.keys(currencyData.fullNames).filter(o=>convertToFilteredVal(o)).map((o,i)=>convertCreateOption(o,i));
        return <select ref={refs.convertSelectRef} {...convertSelectAttribs}>{options}</select>
     }

     const baseFilterAttribs = {
         onKeyUp: handleFilterDownArrow_Base,
         placeholder: "filter",
         onClick: handleBaseFilterClick,
         onChange: handleBaseFilterChange,
         value: baseFilterVal,
     }

     const convertFilterAttribs = {
         onKeyUp: handleFilterDownArrow_Convert,
         placeholder: "another filter",
         onClick: handleConvertFilterClick,
         onChange: handleConvertFilterChange,
         value: convertFilterVal,
     }

     const baseSelectAttribs = {
         size: "5",
         onKeyUp: handleSelectSpecialKeyPresses_Base,
         onChange: handleBaseSelectChange,
         className: "Configure-baseSelectBox"
     }

     const convertSelectAttribs = {
        size: "5",
        onKeyUp: handleSelectSpecialKeyPresses_Convert,
        onChange: handleConvertSelectChange,
        className: "Configure-convertSelectBox"
     }


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
     // employed in input field which is utilized as a filter for base currency

     // a boolean always, should base select be in focus, check if this is needed
    // const [baseSelectInFocus, setBaseSelectInFocus] = useState(false);

     //const [convertSelectInFocus, setConvertSelectInFocus] = useState(false);
     // a boolean, currently a dependancy of a useEffect call which swaps focus into filter and from select if true, check if needed as useEffect, check
     // functionality doesn't break when additional filters and selects are added
     const [goToBaseFilter, setGoToBaseFilter] = useState(false);
     const [goToConvertFilter, setGoToConvertFilter] = useState(false);

     useEffect(fetchAll, [currencyData]);

     // clean this up, define functions for these, comb and weed unnecessary code

     useEffect(()=>{
        if (focusInSelect.base) { 
            ///(()=>{
            refs.baseSelectRef.current.focus();
            refs.baseSelectRef.current.selectedIndex = 0;
       // })()
        } else if (focusInSelect.convert) {
           // (()=>{
            refs.convertSelectRef.current.focus();
            refs.convertSelectRef.current.selectedIndex = 0;
       // })()
        } else {return undefined};

        }, [focusInSelect]);
     
     useEffect(()=> {
        if(goToFilter.base) {
            //(()=>{
               refs.baseFilterRef.current.focus();
                refs.baseSelectRef.current.blur();
                refs.baseSelectRef.current.selectedIndex = -1;
                let arg1 = {...goToFilter, base: false}
                setGoToFilter(arg1);
                    let arg2 = {...focusInSelect, base: false, convert: false};
                setFocusInSelect(arg2);
           // })()
        } else if (goToFilter.convert) {
            (()=>{
                refs.convertFilterRef.current.focus();
                refs.convertSelectRef.current.blur();
               refs.convertSelectRef.current.selectedIndex = -1;
                let arg1 = {...goToFilter, convert: false};
                setGoToFilter(arg1);
                let arg2 = {...focusInSelect, base: false, convert: false};
                setFocusInSelect(arg2);
            })()
        }
     },[goToFilter]);
 
     // useEffect(() => baseSelectInFocus ? (() => {
     //     baseSelectRef.current.focus();
     //     //convertSelectRef.current.blur();
     //     baseSelectRef.current.selectedIndex = 0;
     //     // this is excessive
     //     //convertSelectRef.current.selectedIndex = -1;
     // })() : undefined, [baseSelectInFocus]);

     // useEffect(() => convertSelectInFocus ? (() => {
     //     convertSelectRef.current.focus();
     //     //baseSelectRef.current.blur();
     //     convertSelectRef.current.selectedIndex = 0;
     //     // this is excessive
     //     //baseSelectRef.current.selectedIndex = -1;
     // })() : undefined, [convertSelectInFocus]);


     // useEffect(() => goToBaseFilter ? (() => {
     //     baseFilterRef.current.focus();
     //     baseSelectRef.current.blur();
     //     // do I need this 
     //     baseSelectRef.current.selectedIndex = -1;
     //     setGoToBaseFilter(false);
     //     //setBaseSelectInFocus(false);
     //     setFocusInSelect({...focusInSelect}, {base: false, convert: false});
     //     //setConvertSelectInFocus(false);
     // })() : undefined, [goToBaseFilter, focusInSelect])



     // useEffect(() => goToConvertFilter ? (() => {
     //     convertFilterRef.current.focus();
     //     convertSelectRef.current.blur();
     //     //do I need this
     //     convertSelectRef.current.selectedIndex = -1;
     //     //setPrevConvertSelectIx(-1);
     //     setGoToConvertFilter(false);
     //     //setConvertSelectInFocus(false);
     //     setFocusInSelect({...focusInSelect}, {convert: false, base: false});
     //     //setBaseSelectInFocus(false);
     // })() : undefined, [goToConvertFilter, focusInSelect]);



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
         return <option value={o} key={i} onClick={(e)=>handleOptionClick(o,e)}>{o}: {currencyData.fullNames[o]}</option>
     }

     function convertToFilteredVal(o) {
         let val = o.toLowerCase().startsWith(convertFilterVal.toLowerCase());
         return val && (o.toLowerCase() !== currencyData.convertFrom.toLowerCase());
     }

     function convertCreateOption(o, i) {
         return <option key={i} onClick={e=>console.log('convert option has been clicked')} value={o}>{o}: {currencyData.fullNames[o]}</option>
     }

     function handleSelectSpecialKeyPresses_Base(e) {
         // if up arrow pressed and at first index of list already, restore focus to filter field
         // this allows a smooth user experience of if using up arrow to scroll upward through select list,
         // user "pops" into filter field after scrolling up past option 0
         //e.preventDefault();
         let currentIndex = e.target.selectedIndex;
         if (e.keyCode === 38) {
             console.log('yes its 38');
             (prevBaseSelectIx === 0) ? setGoToFilter({...goToFilter, base: true, convert: false}): setPrevBaseSelectIx(currentIndex);

         } else if (e.key === 'Enter') {
             // when the enter key is pressed on an option, set the "currency to convert from" to the selected option
             let val = refs.baseSelectRef.current.options[refs.baseSelectRef.current.selectedIndex].value;
             //setConvertFrom(baseSelectRef.current.options[baseSelectRef.current.selectedIndex].value);
             
             console.log(currencyData.convertFrom);
             let argu = { ...currencyData, convertFrom: val };
             setcurrencyData(argu);
         }
     }

     function handleSelectSpecialKeyPresses_Convert(e) {
         let currentIndex = e.target.selectedIndex;
         let val = e.target.value;
         if (e.keyCode === 38) {

             (prevConvertSelectIx === 0) ? setGoToFilter({...goToFilter, convert: true, base: false}): setPrevConvertSelectIx(currentIndex);

         } else if (e.key === 'Enter') {
             let newArr;
             let val = refs.convertSelectRef.current.options[refs.convertSelectRef.current.selectedIndex].value;
             if (currencyData.convertTo.includes(val)) {
                 //console.log('val is : ', val);
                 //console.log('on enter, this should be removed');
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
             //console.log("key DOWN ARROW");
             console.log('yes its code 40');
             // if (!baseSelectInFocus) {
             //     setBaseSelectInFocus(true);
             // }
             console.log("this is focusInSelect :\n", focusInSelect);
             //alert(focusInSelect);
             if (!focusInSelect.base){
                //alert('nope');
                let arg = {...focusInSelect, base: true, convert: false};
                setFocusInSelect(arg);
             } else (alert('hep'));
             setPrevBaseSelectIx(currentIndex);
         }
     }

     function handleFilterDownArrow_Convert(e) {
        let currentIndex = e.target.selectedIndex;
         if (e.keyCode === 40) {
             //console.log("key DOwn arrow in CONVERT filter");
             //setConvertSelectInFocus(true);
             console.log('yes its code 40');
             console.log(focusInSelect);
             if (!focusInSelect.convert){
            let arg = {...focusInSelect, convert: true, base: false};
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
         setGoToFilter({...goToFilter, base: true, convert: false});
     }

     function handleConvertFilterClick(e) {
         refs.convertFilterRef.current.focus();
         refs.convertSelectRef.current.selectedIndex = -1;
         refs.baseSelectRef.current.selectedIndex = -1;
         let arg = {...goToFilter, convert: true, base: false};
         setGoToFilter(arg);
     }

     function fetchAll() {
         let baseRates = `latest.json?app_id=${FetchConstants.app_id}&base='${currencyData.convertFrom}'`;
         let baseSubURLfullNames = 'currencies.json';
         let ratesURL = FetchConstants.baseURL + baseRates;
         let namesURL = FetchConstants.baseURL + baseSubURLfullNames;
         fetch(namesURL).then(response => response.json())
             // .then(namesData => {
             //     let arg = { ...currencyData, fullNames: namesData };
             //     setcurrencyData(arg)
             //     return namesData;
             // })
             .then((namesData) => {
                 //console.log('this is data from fetchAll: ', namesData);
                 fetch(ratesURL).then(response => response.json())
                     .then(ratesResults => {
                         //console.log('this is ratesData', ratesData);
                         //let arg = {...currencyData, rates: ratesResults.rates, fullNames: namesData};
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

     function handleOptionClick(optionVal, e) {
         // console.log(e.target.textContent);
         // if double-left click on an option, we want to use selection of this option to set a new convertFrom value (i.e. e.detail val is the consecutive num of left clicks)
         // design decision--- on double click, but NOT on single click, which potentially may be employed by user as part of the navigation process without other intentions
         setFocusInSelect({...focusInSelect, base: true})
         console.log('clicked on option: ', focusInSelect);
         if (e.detail === 2) {
             //let arg = {...currencyData, convertFrom: optionVal};
             setcurrencyData({ ...currencyData, convertFrom: optionVal })
         }
     }
     // not sure if we need to check onChange on select with the current implementation above, ok without using it so far in Firefox, check Chrome, Edge, etc browsers
     function handleBaseSelectChange(thisSelect) {
         let val = thisSelect.target.value;
     }

     function handleConvertSelectChange(thisSelect) {
         let val = thisSelect.target.value;
         //console.log("convertTo select val is now changed to this: ", val);
     }

     function makeCharts() {


         let workingArr = [currencyData.convertFrom, ...currencyData.convertTo]
         let max = currencyData.convertFrom;
         workingArr.forEach(e => {
             let thing = parseFloat(currencyData.rates[e]);
             //console.log(thing);
             if (parseFloat(currencyData.rates[e]) > parseFloat(currencyData.rates[max])) {
                 max = e;
             }

         });
         let divs = workingArr.map(e => {
             let height = parseFloat(currencyData.rates[e]) / parseFloat(currencyData.rates[max]) * 100;
             //return height;
             let styleAttribs = {



             };
             let attribs = {
                 onClick: hiModal,
                 style: {
                     background: "green",
                     width: "10%",
                     display: "inline-block",

                     height: String(height) + '%',
                 },
             }
             return (<div {...attribs}>{e}<div className="thisModal" style={showThisModal ? {display: "block", background: "red"} : undefined}>{e}</div></div>)

         });


         return divs;

     }

     function hiModal(e) {
         let attribs = {

         }
         setShowThisModal(true);

     }
 }
 export default App;