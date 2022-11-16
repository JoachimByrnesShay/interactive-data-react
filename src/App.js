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
                }
            );
    }

    const GenUtils = {
        alphabetizeStringArr: (arr)=> {
            let arr2 = [...arr].sort();
            return arr2;
        }
    }

    const ChartsUtils = {
        getChartsCurrencies: ()=>[currencySelections.convertFrom, ...currencySelections.convertTo],
        getChartsCurrenciesWithSize: ()=>ChartsUtils.getChartsCurrencies().map(value=>{
            return {currency: value, size: ChartsUtils.getIndividualChartSize(value)}
        }),
        getMaxUnitsOfChartCurrs: ()=> {
            let max = currencySelections.convertFrom;
            ChartsUtils.getChartsCurrencies().forEach(value=>{
                if (parseFloat(currencyInfo.rates[value]) > parseFloat(currencyInfo.rates[max])) {
                    max = value;
                }
            })
            return max;
        },
        getIndividualChartSize: (value)=> {
            return parseFloat(currencyInfo.rates[value]) / parseFloat(currencyInfo.rates[ChartsUtils.getMaxUnitsOfChartCurrs()]) * 100
        },
        getChartsOrientation: ()=> isSmallScreen ? 'width' : 'height',
    
    }

    const FilterHandling = {
        handleFilterDownGeneric: (e)=> {
            let currentIndex = e.target.selectedIndex;
            if (e.keyCode === 40) {
                switch (e.target.name) {
                    case'Base':
                        FilterHandling.handleFilterDownArrow_Base(currentIndex);
                        break;
                    case 'Convert':
                        FilterHandling.handleFilterDownArrow_Convert(currentIndex);
                        break;
                    default:
                        break;
                }
            }
        },
        handleFilterDownArrow_Base: (currentIndex)=> {
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
        },
        handleFilterDownArrow_Convert: (currentIndex)=> {
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
        },
        handleBaseFilterClick: (e)=> {
            // if user uses mouse control to travel to and click into the filter field from any distance, instead of using up/down to scroll,
            // reset focus of filter field to "true" and select box to "false" to induce working desired feature set in cooperation with the other tweaks
            // since selectedIndex is manually set in cooperating functions, manually unset with -1 value here
            refs.baseFilterRef.current.focus();
            refs.baseSelectRef.current.selectedIndex = -1;
            refs.convertSelectRef.current.selectedIndex = -1;
            setGoToFilter({ ...goToFilter, base: true, convert: false });
        },
        handleConvertFilterClick: (e)=> {
            refs.convertFilterRef.current.focus();
            refs.convertSelectRef.current.selectedIndex = -1;
            refs.baseSelectRef.current.selectedIndex = -1;
            let arg = { ...goToFilter, convert: true, base: false };
            setGoToFilter(arg);
        },
        handleBaseFilterChange: (thisFilter)=> {
            // the filter field input, used as new value in JSX upon changes
            let val = thisFilter.target.value;
            setBaseFilterVal(val);
        },
        handleConvertFilterChange(thisFilter) {
            let val = thisFilter.target.value;
            setConvertFilterVal(val);
        },
    }

    const SelectHandling = {
        handleMouseEnterGeneric: (e)=> {
            if (e.target.name === 'Base'){
                let art = {...focusInSelect, base: true, convert: false};
                e.target.selected='selected';
                //console.log(refs.baseSelectRef.current.selectedIndex);
                //setPrevBaseSelectIx(refs.baseSelectRef.current.selectedIndex);
                //setPrevBaseSelectIx(refs.baseSelectRef.current.selectedIndex);
                setFocusInSelect(art);
            } else if(e.target.name === 'Convert') {
                e.target.selected='selected';
                let art = {...focusInSelect, base: false, convert: true};
                //setPrevConvertSelectIx(refs.convertSelectRef.current.selectedIndex);
                setFocusInSelect(art);
            }
        },
        noSelectFocus: ()=> {
            setFocusInSelect({...focusInSelect, base: false, convert: false})
        },
        handleSelectSpecialKeyPresses_Base: (e)=> {
            // if up arrow pressed and at first index of list already, restore focus to filter field
            // this allows a smooth user experience of if using up arrow to scroll upward through select list,
            // user "pops" into filter field after scrolling up past option 0
            let currentIndex = e.target.selectedIndex;
            if (e.keyCode === 38) {
                console.log('yes its 38');
                (prevBaseSelectIx === 0) ? setGoToFilter({ ...goToFilter, base: true, convert: false }): setPrevBaseSelectIx(currentIndex)
            } else if (e.key === 'Enter') {
                // when the enter key is pressed on an option, set the "currency to convert from" to the selected option
                let val = refs.baseSelectRef.current.options[refs.baseSelectRef.current.selectedIndex].value;

                console.log(currencySelections.convertFrom);
                let argu = { ...currencySelections, convertFrom: val };
                setCurrencySelections(argu);
            }
        },
        handleSelectSpecialKeyPresses_Convert: (e)=> {
            let currentIndex = e.target.selectedIndex;
        
            if (e.keyCode === 38) {
                (prevConvertSelectIx === 0) ? setGoToFilter({ ...goToFilter, convert: true, base: false }): setPrevConvertSelectIx(currentIndex);
            } else if (e.key === 'Enter') {
                let newArr;
                let val = refs.convertSelectRef.current.options[refs.convertSelectRef.current.selectedIndex].value;
                if (currencySelections.convertTo.includes(val)) {
                    let ix = currencySelections.convertTo.indexOf(val);
                    console.log(ix);
                    let leftArr = currencySelections.convertTo.slice(0, ix);
                    let rightArr = currencySelections.convertTo.slice(ix + 1);
                    newArr = [...leftArr, ...rightArr];
                } else if (currencySelections.convertTo.length >= 7){
                    setIsFlashDisplayed(true);
                    return;
                }  else {
                    newArr = [...currencySelections.convertTo, val]
                }
                newArr = GenUtils.alphabetizeStringArr(newArr);
                setCurrencySelections({ ...currencySelections, convertTo: newArr})
            }
        },
        handleOptionClick_base: (optionVal, e)=> {
            // console.log(e.target.textContent);
            // if double-left click on an option, we want to use selection of this option to set a new convertFrom value (i.e. e.detail val is the consecutive num of left clicks)
            // design decision--- on double click, but NOT on single click, which potentially may be employed by user as part of the navigation process without other intentions

            //cannot currently do the below because it sets the selected index to 0 which is incorrect if clicking into the option directly via mouseover from another element/location on the page.
            let ix = refs.baseSelectRef.current.selectedIndex;
            setPrevBaseSelectIx(ix);
            console.log('clicked on option: ', focusInSelect);
            if (e.detail >= 2) {
                setCurrencySelections({ ...currencySelections, convertFrom: optionVal })
            }
        },
        handleOptionClick_convert(optionVal, e) {
            let ix = refs.convertSelectRef.current.selectedIndex;
            setPrevConvertSelectIx(ix);
            if (e.detail >= 2) {
                console.log('2 in handleOptionClick_convert');
                let newArr;
                let val = optionVal;
                
                if (currencySelections.convertTo.includes(val)) {
                    let ix = currencySelections.convertTo.indexOf(val);
                    console.log(ix);
                    let leftArr = currencySelections.convertTo.slice(0, ix);
                    let rightArr = currencySelections.convertTo.slice(ix + 1);
                    newArr = [...leftArr, ...rightArr];
                } else if (currencySelections.convertTo.length >= 7) {
                    setIsFlashDisplayed(true);
                return; 
                } else {
                    newArr = [...currencySelections.convertTo, val];
                }
                newArr = GenUtils.alphabetizeStringArr(newArr);
                console.log('newArr in handleoptionclick is :', newArr);
                setCurrencySelections({ ...currencySelections, convertTo: newArr})
            }
        },
        handleBaseSelectChange: (thisSelect)=> {
           return null;
        },
        handleConvertSelectChange: (thisSelect)=> {
            return null;
        },
    // not sure if we need to check onChange on select with the current implementation above, ok without using it so far in Firefox, check Chrome, Edge, etc browsers
    }

    const [isChartModalDisplayed, setIsChartModalDisplayed] = useState(Array(7).fill(false));
    const [isChartModalAnimatingDisappearance, setIsChartModalAnimatingDisappearance] = useState(Array(7).fill(false));


    const ModalHandling = {
        showModal: (e,ix)=> { 

        
            let thisModalDisplayState;

            thisModalDisplayState = true;
    
            let animating = false;
            //false newVal means no longer displaying so here we should set animation into Effect;
            let resetIsChartModalAnimating = [...isChartModalAnimatingDisappearance.splice(0, ix), false, ...isChartModalAnimatingDisappearance.splice(ix+1)];
           
            let newDisplaySet = [...isChartModalDisplayed.slice(0,ix),thisModalDisplayState, ...isChartModalDisplayed.slice(ix+1)];
            setIsChartModalAnimatingDisappearance(resetIsChartModalAnimating);
            setIsChartModalDisplayed(newDisplaySet);
        },
        hideModal: (e,ix)=> {
            if (isChartModalDisplayed[ix]) {
                let thisModalDisplayState = false;
                let animating = true;
                let resetIsChartModalAnimating = [...isChartModalAnimatingDisappearance.splice(0, ix), animating, ...isChartModalAnimatingDisappearance.splice(ix+1)];
               
                let newDisplaySet = [...isChartModalDisplayed.slice(0,ix),thisModalDisplayState, ...isChartModalDisplayed.slice(ix+1)];
                setIsChartModalAnimatingDisappearance(resetIsChartModalAnimating);
                setIsChartModalDisplayed(newDisplaySet);
            }
        }
    }
     // references are utilized for the purpose of managing focus of filters (text input) and the related select boxes only
     // programmatic management necessary due to the implemented feature-set
    const refs = {
        baseFilterRef: useRef(null),
        baseSelectRef: useRef(null),
        convertFilterRef: useRef(null),
        convertSelectRef: useRef(null),
    }
     // modulate show or hide of modal with boolean value, ternary expression uses this in jsx build of modal attributes, i.e. related functions
    // const [isChartModalDisplayed, setIsChartModalDisplayed] = useState(Array(7).fill(false));
    // const [isChartModalAnimating, setIsChartModalAnimating] = useState(Array(7).fill(false));

    const [isFlashDisplayed, setIsFlashDisplayed] = useState(false);

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [baseFilterVal, setBaseFilterVal] = useState("");
    const [convertFilterVal, setConvertFilterVal] = useState("");


  

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

    // const [baseSelectValue,setBaseSelectValue] = useState('');

    // const [windowWidthValue, setWindowWidthValue] = useState(null);
    const [prevBaseSelectIx, setPrevBaseSelectIx] = useState(-1);
    const [prevConvertSelectIx, setPrevConvertSelectIx] = useState(-1);
     
    //const [goToBaseFilter, setGoToBaseFilter] = useState(false);
    //const [goToConvertFilter, setGoToConvertFilter] = useState(false);

    // note 10/24--- as of the current state of the app, this below useEffect call cannot use currencyData as a dependency, it will be called too frequently
    useEffect(fetchAll, [currencySelections.convertFrom]);
    // useEffect(()=>alphabetizeComparisons, [currencySelections]);

     
   

    

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

    useEffect(() => {if (isFlashDisplayed){
      setTimeout(()=>{setIsFlashDisplayed(false)}, 2000);
    }}, [isFlashDisplayed]);

    useEffect(() => {
        if (focusInSelect.base) {
           
             refs.baseSelectRef.current.focus();
             let index = refs.baseSelectRef.current.selectedIndex;
             if (index === -1){
                refs.baseSelectRef.current.selectedIndex = 0;
             }
             // else {
              
             //    //refs.baseSelectRef.current.selectedIndex = prevBaseSelectIx;
             //    setPrevBaseSelectIx(refs.baseSelectRef.current.selectedIndex);
             // }
             //(index === -1) ? refs.baseSelectRef.current.selectedIndex = 0 : refs.baseSelectRef.current.selectedIndex = prevBaseSelectIx;
             //refs.baseSelectRef.current.selectedIndex = 0;
             // } else if (focusInSelect.convert) {
             //     refs.convertSelectRef.current.focus();
             //     refs.convertSelectRef.current.selectedIndex = 0;

             // } 
        } else if (focusInSelect.convert) {
            //alert('convert');
            refs.convertSelectRef.current.focus();
            let index = refs.convertSelectRef.current.selectedIndex;
            if (index === -1){
                refs.convertSelectRef.current.selectedIndex = 0;
            } else {
                setPrevBaseSelectIx(refs.convertSelectRef.current.selectedIndex);
                //refs.baseSelectRef.current.selectedIndex = prevBaseSelectIx;
            }
        }
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
                <p className={'Header-flashMessage'}>SELECT NO MORE THAN 7 COMPARISONS.<br/>TO DESELECT A SELECTED CHOICE, click it.</p>
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
                    <label className='Configure-baseFilterLabel'>
                        FILTER
                        <input 
                            ref={refs.baseFilterRef}
                            name='Base'
                            onKeyUp={FilterHandling.handleFilterDownGeneric}
                            placeholder=""
                            onClick={FilterHandling.handleBaseFilterClick}
                            onChange={FilterHandling.handleBaseFilterChange}
                            value={baseFilterVal}
                            id={'Configure-baseFilter'}
                            className={'Configure-baseFilter'}
                        />
                    </label>
                    <select 
                        name='Base'
                        ref={refs.baseSelectRef}
                        size="4"
                        onKeyUp={SelectHandling.handleSelectSpecialKeyPresses_Base}
                        onChange={SelectHandling.handleBaseSelectChange}
                        className={"Configure-baseSelectBox"}
                        onMouseEnter={SelectHandling.handleMouseEnterGeneric}
                        onMouseOut={SelectHandling.noSelectFocus}  
                    >
                        {
                            Object.keys(currencyInfo.fullNames)
                            .filter(curr => curr.toLowerCase().startsWith(baseFilterVal.toLowerCase()))
                            .map((curr, index) => (
                                <option value={curr} key={index} 
                                    className={'Configure-baseOption'} 
                                 
                                    //onMouseEnter={(e)=>{e.target.selected='selected';console.log('selected in select per option is: ', e.target.selected)}} 
                                    onClick={(e)=>SelectHandling.handleOptionClick_base(curr,e)}
                                    >
                                        {curr}: {currencyInfo.fullNames[curr]}
                                </option>
                            ))
                        }
                    </select>                    
                </form>
            </div>
 
            <div className="Configure-Comparisons">
                <h2 className='Configure-comparisonHeading'>Select &lt;= 7 currencies to compare</h2>
                <form className='Configure-comparisonsForm'>
                    <label className='Configure-comparisonsFilterLabel'>
                        FILTER
                        <input
                            name='Convert'
                            ref={refs.convertFilterRef}
                            onKeyUp={FilterHandling.handleFilterDownGeneric}
                            placeholder=""
                            onClick={FilterHandling.handleConvertFilterClick}
                            onChange={FilterHandling.handleConvertFilterChange}
                            value={convertFilterVal}
                            id='Configure-comparisonsFilter'
                            className={'Configure-comparisonsFilter'}
                        />
                    </label>
                   
                    <select  
                        name='Convert'
                        ref={refs.convertSelectRef}
                        size="4"
                        onMouseEnter={SelectHandling.handleMouseEnterGeneric}
                        //onKeyUp: handleSelectSpecialKeyPresses_Convert,
                        onKeyUp={SelectHandling.handleSelectSpecialKeyPresses_Convert} 
                        onChange={SelectHandling.handleConvertSelectChange}
                        className={"Configure-comparisonsSelectBox"}
                    >
                        {
                            Object.keys(currencyInfo.fullNames)
                            .filter(curr => (
                                curr.toLowerCase().startsWith(convertFilterVal.toLowerCase()) //
                                && (curr.toLowerCase() !== currencySelections.convertFrom.toLowerCase())
                            ))
                            .map((curr, index) => (
                                <option value={curr} 
                                    //onMouseEnter={(e)=>{e.target.selected='selected'}} 
                                    //onMouseEnter={()=>setBaseSelectValue(curr)}
                                    key={index} 
                                    //className={currencySelections.convertTo.includes(curr) ? 'Configure-comparisonOption is-selectedComparison' : 'Configure-comparisonOption'} 
                                    //className={'Configure-comparisonOption' + (currencySelections.convertTo.includes(curr) ? ' ' + 'is-selectedComparison' : '')}
                                    className={`Configure-comparisonOption ${currencySelections.convertTo.includes(curr) ? ' is-selectedComparison' : ''}`}
                                    onClick={(e)=>SelectHandling.handleOptionClick_convert(curr,e)}>
                                        {curr}: {currencyInfo.fullNames[curr]}
                                </option>
                            ))
                        }
                    </select>
                </form>
            </div>
            

            <div className='Configure-showCurrentConfigurationContainer'>
                <div className='Configure-showCurrentConfiguration'>
                    <div className='Configure-showBaseContainer'>
                        <h3>Base:</h3>
                  
                        <div 
                            className='Configure-showBaseContainer'>
                            <p className='Configure-baseValue'
                                data-tooltip-title={currencyInfo.fullNames[currencySelections.convertFrom]}>
                                {currencySelections.convertFrom}
                            </p>
                        </div>
                    </div>
                    <div className='Configure-showComparisonsContainer'>
                        <h3>Comparisons:</h3>
                        <div className='Configure-showComparisons'>
                            {
                                currencySelections.convertTo
                                .map((curr,index)=>
                                        <p className='Configure-comparisonValue' key={index}
                                        data-tooltip-title={currencyInfo.fullNames[curr]}>
                                            {curr}
                                        </p>
                                )
                            }
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
            {
                ChartsUtils.getChartsCurrenciesWithSize().map((chartInfo,ix)=>(
                    
                    <div className={`ChartContent-barChartContainer ${ix === 0 ? "is-baseChart" : ""}`} key={ix}>
                        <div style={{ [ChartsUtils.getChartsOrientation()]: String(chartInfo.size) + '%'}}
                            onClick={(e)=>ModalHandling.showModal(e,ix)}
                            onMouseLeave={(e)=>ModalHandling.hideModal(e,ix)}
                            className={`ChartContent-barChart`}>
                            <p 
                                style={{
                                   bottom:  chartInfo.size < 8 ? (`calc(${chartInfo.size}% + 1em)`) : '0em'
                                }}
                                className={`ChartContent-barChartTitle ${chartInfo.size < 8 ? " u-offset" : ""}`}>{chartInfo.currency}
                            </p>
                            <div         
                                //onClick={(e)=>modalEventHandler(e,ix)} 
                                //className={isChartModalDisplayed[ix] ? "Modal isdisplayed" : (isChartModalAnimatingDisappearance[ix] ? "Modal disappearModal" : "Modal")}
                                className={`Modal ${isChartModalDisplayed[ix] ? "isdisplayed" : (isChartModalAnimatingDisappearance[ix] ? "disappearModal" : "")}`}
                            >
                                <p>{currencyInfo.fullNames[chartInfo.currency]}</p>
                                <p>1 {currencySelections.convertFrom}=={currencyInfo.rates[chartInfo.currency]} {chartInfo.currency}</p>


                            </div>
                        </div>
                    </div>
                ))
            }
    
        </main>
        <footer className="Footer">&copy; 2022 Joachim Byrnes-Shay</footer>
    </div>)
  
}

export default App;
