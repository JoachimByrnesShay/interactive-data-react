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



     // modulate show or hide of modal with boolean value, ternary expression uses this in jsx build of modal attributes, i.e. related functions
     const [isChartModalDisplayed, setIsChartModalDisplayed] = useState(Array(7).fill(false));

     const [isFlashDisplayed, setIsFlashDisplayed] = useState(false);

     const [isSmallScreen, setIsSmallScreen] = useState(false);
     const [baseFilterVal, setBaseFilterVal] = useState("");
     const [convertFilterVal, setConvertFilterVal] = useState("");

     
     const elemAttribs = {
         baseFilter: {
            ref: refs.baseFilterRef,
             onKeyUp: handleFilterDownGeneric,
             placeholder: "",
             onClick: handleBaseFilterClick,
             onChange: handleBaseFilterChange,
             value: baseFilterVal,
             id: 'Configure-baseFilter',
            className: 'Configure-baseFilter',
            name:'Base',
         },
         convertFilter: {
            ref: refs.convertFilterRef,
             onKeyUp: handleFilterDownGeneric,
             placeholder: "",
          
             onClick: handleConvertFilterClick,
             onChange: handleConvertFilterChange,
             value: convertFilterVal,
             id:'Configure-comparisonsFilter',
             className:'Configure-comparisonsFilter',
             name: 'Convert',
         },
         baseSelect: {
            ref: refs.baseSelectRef,
             size: "4",
             onKeyUp: handleSelectSpecialKeyPresses_Base,
             onChange: handleBaseSelectChange,
             className: "Configure-baseSelectBox"
             
         },
         convertSelect: {
            ref: refs.convertSelectRef,
             size: "4",
             //onKeyUp: handleSelectSpecialKeyPresses_Convert,
             onKeyUp: handleSelectSpecialKeyPresses_Convert, 
             onChange: handleConvertSelectChange,
             className: "Configure-comparisonsSelectBox"
         }
     }

     const [isChartModalAnimating, setIsChartModalAnimating] = useState(Array(5).fill(false));

     const BaseFilter = () => <input {...elemAttribs.baseFilter}/>

     const ConvertFilter = () => <input {...elemAttribs.convertFilter}/>

     const BaseSelect = () => {
         let options = Object.keys(currencyInfo.fullNames).filter(o => baseFilteredVal(o)).map((o, i) => baseCreateOption(o, i));
         return <select {...elemAttribs.baseSelect}>
                    {options}
                </select>
     }
     const ConvertSelect = () => {
         let options = Object.keys(currencyInfo.fullNames).filter(o => convertToFilteredVal(o)).map((o, i) => convertCreateOption(o, i));
         return <select {...elemAttribs.convertSelect}>
                    {options}
                </select>
     }

    // this might be less hassle if I break this into 3 or 4 different state variables, or at least 2.
     // const [currencyData, setCurrencyData] = useState({
     //     convertFrom: 'USD',
     //     convertTo: ['AED', 'BGN', 'CNY', 'EUR', 'GBP'],
     //     rates: {},
     //     fullNames: {},
     // });
     //currencySelections, currencyInfo
     const [currencySelections, setCurrencySelections] = useState({
        convertFrom: 'USD',
        convertTo: ['AED', 'BGN', 'CNY', 'EUR', 'GBP'],
         
     });

     const [currencyInfo, setCurrencyInfo] = useState({
        rates: {},
         fullNames: {},
     })

     const [focusInSelect, setFocusInSelect] = useState({
         base: false,
         convert: false,
     });

     const [goToFilter, setGoToFilter] = useState({
         base: false,
         convert: false,
     });

    const [windowWidthValue, setWindowWidthValue] = useState(null);
     const [prevBaseSelectIx, setPrevBaseSelectIx] = useState(-1);
     const [prevConvertSelectIx, setPrevConvertSelectIx] = useState(-1);
     
     const [goToBaseFilter, setGoToBaseFilter] = useState(false);
     const [goToConvertFilter, setGoToConvertFilter] = useState(false);

     // note 10/24--- as of the current state of the app, this below useEffect call cannot use currencyData as a dependency, it will be called too frequently
     useEffect(fetchAll, []);
        // useEffect(()=>alphabetizeComparisons, [currencySelections]);
   
         // will not be more than 7 items
     function alphabetizeStringArr(arr) {
        // sort copy of values;
        console.log('yes i should be alphabetizing')
        let arr2 = [...arr].sort();
        return arr2;
     }

     useEffect(() => {
        window.addEventListener('resize', handleWindowWidth);
        function handleWindowWidth() {   
                if (window.innerWidth < 950) {
                    setIsSmallScreen(true);
                } else {
                    setIsSmallScreen(false);
                }
            }
        handleWindowWidth();
        },[]);

     // clean this up, define functions for these, comb and weed unnecessary code

    // useEffect(() => {if (isFlashDisplayed){
    //   setTimeout(()=>{setIsFlashDisplayed(false)}, 2000);
    // }}, [isFlashDisplayed]);

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
    <h1 className='Header-title'>Currency Visualization</h1>
            <div className={`Header-flashContainer ${isFlashDisplayed ? "isDisplayed" : ""}`}>
                <p className={'Header-flashMessage'}>SELECT NO MORE THAN 5 COMPARISONS.<br/>TO DESELECT A SELECTED CHOICE, i.e click it.</p>
            </div>
    </header>
    <section className="Configure">
        <div className="Configure-Base">
        <h2 className='Configure-baseHeading'>Change your base currency from 
            <span className='Configure-baseHeadingValue'
                data-tooltip-title={currencyInfo.fullNames[currencySelections.convertFrom]} 
            >
                {currencySelections.convertFrom} 
            </span>
        </h2>
      
            <form className='Configure-baseForm'>
            <label className='Configure-baseFilterLabel'>FILTER
                {BaseFilter()}           </label>
            
            {BaseSelect()}
            </form>
        </div>
        <div className="Configure-Comparisons">
        <h2 className='Configure-comparisonHeading'>Select &lt;= 5 currencies to compare</h2>
        <form className='Configure-comparisonsForm'>
            <label className='Configure-comparisonsFilterLabel'>FILTER
                {ConvertFilter()} 
              </label>
            {ConvertSelect()}
            </form>
        </div>
        <div className='Configure-showCurrentConfigurationContainer'>
                <div className='Configure-showCurrentConfiguration'>
                    <div className='Configure-showBaseContainer'>
                        <h3>Base:</h3>
                  
                        <div 
                            className='Configure-showBaseContainer'>
                            <p className='Configure-baseValue'
                                data-tooltip-title={currencyInfo.fullNames[currencySelections.convertFrom]} 
                            >
                            {currencySelections.convertFrom}
                            </p>
                        </div>
                    </div>
                    <div className='Configure-showComparisonsContainer'>
                        <h3>Comparisons:</h3>
                       
                        <div className='Configure-showComparisons'>
                            {currencySelections.convertTo.map(elem=>
                                <p className='Configure-comparisonValue' 
                                    data-tooltip-title={currencyInfo.fullNames[elem]}>
                                    {elem}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className='Configure-clearChartsContainer'>
                <button className='Configure-clearChartsButton'>
                    Clear charts + comparisons
                </button>
            </div>
    </section>
    <main className="ChartContent">
     
    {makeCharts()}
    
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
         return <option value={o} key={i} className={'Configure-baseOption'} onMouseEnter={(e)=>{e.target.selected='selected'}} onClick={(e)=>handleOptionClick_base(o,e)}>{o}: {currencyInfo.fullNames[o]}</option>
     }

     function convertToFilteredVal(o) {
         let val = o.toLowerCase().startsWith(convertFilterVal.toLowerCase());
         return val && (o.toLowerCase() !== currencySelections.convertFrom.toLowerCase());
     }

     function convertCreateOption(o, i) {
         return <
            option value={o} 
            onMouseEnter={(e)=>{e.preventDefault();e.target.selected='selected'}} 
            key={i} 
            className={currencySelections.convertTo.includes(o) ? 'Configure-comparisonOption is-selectedComparison' : 'Configure-comparisonOption'} 
            onClick={(e)=>handleOptionClick_convert(o,e)}
            >
            {o}: {currencyInfo.fullNames[o]}
        </option>
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

             console.log(currencySelections.convertFrom);
             let argu = { ...currencySelections, convertFrom: val };
             setCurrencySelections(argu);
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
             if (currencySelections.convertTo.includes(val)) {
                 let ix = currencySelections.convertTo.indexOf(val);
                 console.log(ix);
                 let endIx = currencySelections.convertTo.length - 1;
                 let leftArr = currencySelections.convertTo.slice(0, ix);
                 let rightArr = currencySelections.convertTo.slice(ix + 1, endIx + 1);
                 newArr = [...leftArr, ...rightArr];
             } else {
                 newArr = [...currencySelections.convertTo, val]
             }
             setCurrencySelections({ ...currencySelections, convertTo: alphabetizeStringArr(newArr)})
         }
     }


     function handleFilterDownGeneric(e) {
        let currentIndex = e.target.selectedIndex;
        if (e.keyCode === 40) {
            switch (e.target.name) {
                case'Base':
                    handleFilterDownArrow_Base(currentIndex);
                    break;
                case 'Convert':
                    handleFilterDownArrow_Convert(currentIndex);
                    break;
            }
        }
     }


     function handleFilterDownArrow_Base(currentIndex) {
         // if down arrow pressed while in filter field, set focus to select box below it
         // part II of providing the user an up/down scrollable unit consisting of both filter field and select options list combined
        //  let currentIndex = e.target.selectedIndex;
        //  if (e.keyCode === 40) {
        //      console.log('yes its code 40');
        //      console.log("this is focusInSelect :\n", focusInSelect);
             if (!focusInSelect.base) {
                 let arg = { ...focusInSelect, base: true, convert: false };
                 setFocusInSelect(arg);
             };
             setPrevBaseSelectIx(currentIndex);
         //}
     }

     function handleFilterDownArrow_Convert(currentIndex) {
        //  let currentIndex = e.target.selectedIndex;
        //  if (e.keyCode === 40) {
        //      console.log('yes its code 40');
        //      console.log(focusInSelect);
             if (!focusInSelect.convert) {
                 let arg = { ...focusInSelect, convert: true, base: false };
                 setFocusInSelect(arg);
             }
             setPrevConvertSelectIx(currentIndex);
         //}
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
         let baseRates = `latest.json?app_id=${FetchConstants.app_id}&base='${currencySelections.convertFrom}'`;
         let baseSubURLfullNames = 'currencies.json';
         let ratesURL = FetchConstants.baseURL + baseRates;
         let namesURL = FetchConstants.baseURL + baseSubURLfullNames;
         fetch(namesURL).then(response => response.json())
            .then((namesData) => {
                 fetch(ratesURL).then(response => response.json())
                     .then(ratesResults => {

                         setCurrencyInfo({ ...currencyInfo, rates: ratesResults.rates, fullNames: namesData });
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
             setCurrencySelections({ ...currencySelections, convertFrom: optionVal })
         }
     }

     function handleOptionClick_convert(optionVal, e) {
         let ix = refs.convertSelectRef.current.selectedIndex;
         setPrevConvertSelectIx(ix);
         if (e.detail === 2) {
            console.log('2 in handleOptionClick_convert');
             let newArr;
             let val = optionVal;
             
             if (currencySelections.convertTo.includes(val)) {
                alert(val);
                 let ix = currencySelections.convertTo.indexOf(val);
                 console.log(ix);
                 let endIx = currencySelections.convertTo.length - 1;
                 let leftArr = currencySelections.convertTo.slice(0, ix);
                 let rightArr = currencySelections.convertTo.slice(ix + 1);
                 newArr = [...leftArr, ...rightArr];
             } else if (currencySelections.convertTo.length >= 7){
                setIsFlashDisplayed(true);
                return; 
             } else {
                 newArr = [...currencySelections.convertTo, val];
             }
             newArr = alphabetizeStringArr(newArr);
             console.log('newArr in handleoptionclick is :', newArr);
             setCurrencySelections({ ...currencySelections, convertTo: newArr})
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

         let workingArr = [currencySelections.convertFrom, ...currencySelections.convertTo]
         let max = currencySelections.convertFrom;
         workingArr.forEach(value => {
             if (parseFloat(currencyInfo.rates[value]) > parseFloat(currencyInfo.rates[max])) {
                 max = value;
             }
         });
        

         let divs = workingArr.map((value,ix) => {
            //?????????
            //setIsChartModalDisplayed([...isChartModalDisplayed, false]);
             let size = parseFloat(currencyInfo.rates[value]) / parseFloat(currencyInfo.rates[max]) * 100;
             let needToOffsetTitle = size < 8 ? " u-offset" : "";
             let attribs1 = {
                
            }
        

            //let dimension = (Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)) > 950 ? 'height' : 'width';
            let dimension = isSmallScreen ? 'width' : 'height';
           // dimension === 'width' ? setIsSmallScreen(true) : setIsSmallScreen(false);
            let attribs2 = {
                style:{[dimension]: String(size) + '%',
                },
                onClick: (e)=>modalEventHandler(e,ix),
                 onMouseOut: isChartModalDisplayed[ix] ? (e)=>modalEventHandler(e,ix) : null
                 
             }
       
             let isBaseChart = ix === 0 ? "is-baseChart" : null;
             let calcOffset = `bottom: calc(${size} + 1em)`;
             let styleOffSet = size < 8 ? {bottom: `calc(${size}% + 1em)`} : {};
             return (
                <div {...attribs1} className={`ChartContent-barChartContainer ${isBaseChart}`}>
                    <div {...attribs2} className={`ChartContent-barChart`}>
                        <p style={styleOffSet} className={"ChartContent-barChartTitle" + needToOffsetTitle}>{value}</p>
                        <div 
                             
                        
                            onClick={(e)=>modalEventHandler(e,ix)} 
                            className={isChartModalDisplayed[ix] ? "Modal isdisplayed" : (isChartModalAnimating[ix] ? "Modal disappearModal" : "Modal")}>
                            <p>{currencyInfo.fullNames[value]}</p>
                            <p>1 {currencyInfo.convertFrom}=={currencyInfo.rates[value]} {value}</p>
                        </div>
                    </div>
                </div>
             )
             
         });

         return divs;
     }

     function modalEventHandler(e,ix) {
        console.log('events here: ');
        console.log(e);

        let modalName = `modal${ix}`;
        let thisModelDisplayState = (e.type === "mouseout") ? false : true;
        let animating = !thisModelDisplayState;
        //false newVal means no longer displaying so here we should set animation into Effect;
        let resetIsChartModalAnimating = [...isChartModalAnimating.splice(0, ix), animating, ...isChartModalAnimating.splice(ix+1)];
       
        let newSet = [...isChartModalDisplayed.slice(0,ix),thisModelDisplayState, ...isChartModalDisplayed.slice(ix+1)];
        setIsChartModalAnimating(resetIsChartModalAnimating);
        setIsChartModalDisplayed(newSet);

     }
 }
 export default App;