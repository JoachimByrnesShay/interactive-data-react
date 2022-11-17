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

const MaxNumOfComparisons = 7;

function App() {
    const Refs = {
        baseFilter: useRef(null),
        convertFilter: useRef(null),
        baseSelect: useRef(null),
        convertSelect: useRef(null),
    }
  
    const [prevBaseIndex, setPrevBaseIndex] = useState(-1);
    const [prevConvertIndex, setPrevConvertIndex] =useState(-1);
    const [isChartModalDisplayed, setIsChartModalDisplayed] =useState(Array(MaxNumOfComparisons+1).fill(false));
    const [isChartModalAnimatingDisappearance, setIsChartModalAnimatingDisappearance] = useState(Array(MaxNumOfComparisons+1).fill(false));

    const [baseSelectValue,setBaseSelectValue] = useState(undefined);
    const [convertSelectValue,setConvertSelectValue] = useState(undefined);

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
    });

  

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
       
        handleBaseFilterChange: (thisFilter)=> {
            // the filter field input, used as new value in JSX upon changes
            let val = thisFilter.target.value;
     
            setBaseFilterVal(val);
        },
        handleConvertFilterChange(thisFilter) {
            let val = thisFilter.target.value;
            setConvertFilterVal(val);
        },

        handleBaseFilterDownArrowToSelect(e) {
            if (e.keyCode === 40){
                console.log("should go to select");
                Refs.baseSelect.current.focus();
                /// manually set index because otherwise the select element is focused but index is undefined at first,
                // requiring 2 down arrow key hits to get to index 0 instead of 1.
                Refs.baseSelect.current.selectedIndex = 0;
            }
        },
        handleConvertFilterDownArrowToSelect(e) {
            if(e.keyCode === 40) {
                console.log("should go to select");
                Refs.convertSelect.current.focus();
                Refs.convertSelect.current.selectedIndex = 0;
            }
        }
    
    }

    const SelectHandling = {
 
        // handleUpEnter_Base: (optionVal,e)=> {
        //     // if up arrow pressed and at first index of list already, restore focus to filter field
        //     // this allows a smooth user experience of if using up arrow to scroll upward through select list,
        //     // user "pops" into filter field after scrolling up past option 0
        //      setCurrencySelections({ ...currencySelections, convertFrom: optionVal })

        // },
      


        baseSelectKeys: (e)=>{
           
            let ix = e.target.selectedIndex;

            // on Enter key pressed on option in select element, the convertFrom currency will be changed ot the new value, i.e. of option selected upon enter pressed
            if(e.key === 'Enter') {
                 setCurrencySelections({ ...currencySelections, convertFrom: e.target.value })
            } 
            // if the previous recorded base index value is the first option and the upArrow is pressed, go up into the base filter field
            if(prevBaseIndex === 0 && e.keyCode === 38){
                setBaseSelectValue(undefined);
                Refs.baseSelect.current.selectedIndex = -1;
                Refs.baseFilter.current.focus();

            } 
            // otherwise either down arrow or another key has been pressed, default behavior of down arrow is to continue to traverse downward through the options one by one
            // default behavior of other alpha keys IF the filter field is blank will be to navigate to the next option whose value starts with the letter pressed
            // set a new previous index value in all cases
            setPrevBaseIndex(ix);
        },
        convertSelectKeys: (e)=> {
         let ix = e.target.selectedIndex;
         let val = e.target.value;
         if (prevConvertIndex === 0 && e.keyCode === 38) {
            setConvertSelectValue(undefined);
            Refs.convertSelect.current.selectedIndex = -1;
            Refs.convertFilter.current.focus();

         } else if (e.key === 'Enter') {
             let newArr;
             let val = Refs.convertSelect.current.options[Refs.convertSelect.current.selectedIndex].value;
             if (currencySelections.convertTo.includes(val)) {
                 let ix = currencySelections.convertTo.indexOf(val);
                 let leftArr = currencySelections.convertTo.slice(0, ix);
                 let rightArr = currencySelections.convertTo.slice(ix + 1);
                 newArr = [...leftArr, ...rightArr];
             } else if (currencySelections.convertTo.length >= MaxNumOfComparisons){
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
        
            
            if (e.detail >= 2) {
                setCurrencySelections({ ...currencySelections, convertFrom: optionVal })
            }
        },
        handleOptionClick_convert(optionVal, e) {
          
          
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
                } else if (currencySelections.convertTo.length >= MaxNumOfComparisons) {
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



    const ModalHandling = {
        showModal: (e,ix)=> { 

            let thisModalDisplay = true;
    
            //false newVal means no longer displaying so here we should set animation into Effect;
            let resetIsChartModalAnimating = [...isChartModalAnimatingDisappearance.splice(0, ix), !thisModalDisplay, ...isChartModalAnimatingDisappearance.splice(ix+1)];
           
            let newDisplaySet = [...isChartModalDisplayed.slice(0,ix),thisModalDisplay,...isChartModalDisplayed.slice(ix+1)];
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

     // modulate show or hide of modal with boolean value, ternary expression uses this in jsx build of modal attributes, i.e. related functions
 


 



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


    

     // APP METHODS are temporarily defined below the return block for development purposes
    return (
         // prevent default behavior of refresh of browser page when enter key is pressed in any/all input field
        <div className="Page" onKeyDown={(e)=>e.keyCode === 13 ? e.preventDefault() : undefined}>
        <header className="Header">
        <h1 className='Header-title'>Currency Visualization</h1>
            <div className={`Header-flashContainer ${isFlashDisplayed ? "isDisplayed" : ""}`}>
                <p className={'Header-flashMessage'}>SELECT NO MORE THAN {MaxNumOfComparisons} COMPARISONS.<br/>TO DESELECT A SELECTED CHOICE, click it.</p>
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

                           ref={Refs.baseFilter}
                            name='Base'
                            placeholder=''
                            id={'Configure-baseFilter'}
                            className={'Configure-baseFilter'}
                            value={baseFilterVal}
                            onKeyUp={FilterHandling.handleBaseFilterDownArrowToSelect}
                            onChange={(e)=>setBaseFilterVal(e.target.value)}

                        />
                    </label>
                    <select 
                        ref={Refs.baseSelect}
                        name='Base'
                        size="4"
                         
                        className={"Configure-baseSelectBox"}
                        value={baseSelectValue}
                    
                        onKeyUp={SelectHandling.baseSelectKeys}
                        onChange={e=>setBaseSelectValue(e.target.value)}
                 
                        
                     
                    >
                        {
                            Object.keys(currencyInfo.fullNames)
                            .filter(curr => curr.toLowerCase().startsWith(baseFilterVal.toLowerCase()))
                            .map((curr, index) => (
                                <option value={curr} key={index}
                                    className={'Configure-baseOption'} 
                                                         
                                    onClick={(e)=>{SelectHandling.handleOptionClick_base(curr,e)}}
                                    >
                                        {curr}: {currencyInfo.fullNames[curr]}
                                </option>
                            ))
                        }
                    </select>                    
                </form>
            </div>
 
            <div className="Configure-Comparisons">
                <h2 className='Configure-comparisonHeading'>Select &lt;= {MaxNumOfComparisons} currencies to compare</h2>
                <form className='Configure-comparisonsForm'>
                    <label className='Configure-comparisonsFilterLabel'>
                        FILTER
                        <input
                            ref={Refs.convertFilter}
                            name='Convert'
                            placeholder=""
                            id='Configure-comparisonsFilter'
                            className={'Configure-comparisonsFilter'}
                            value={convertFilterVal}
                            onInput={(e)=>setConvertFilterVal(e.target.value)}
                            onKeyUp={FilterHandling.handleConvertFilterDownArrowToSelect}
                            onChange={(e)=>setConvertFilterVal(e.target.value)}
                        />
                    </label>
                   
                    <select  
                        ref={Refs.convertSelect}
                        name='Convert'
                        size="4"
                        className={"Configure-comparisonsSelectBox"}
                        value={convertSelectValue}
                        onChange={e=>setConvertSelectValue(e.target.value)}
                        onKeyUp={SelectHandling.convertSelectKeys}
                    >
                        {
                            Object.keys(currencyInfo.fullNames)
                            .filter(curr => (
                                curr.toLowerCase().startsWith(convertFilterVal.toLowerCase()) //
                                && (curr.toLowerCase() !== currencySelections.convertFrom.toLowerCase())
                            ))
                            .map((curr, index) => (
                                <option value={curr} 
                                    key={index} 
                                   
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
