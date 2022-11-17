import { useState, useEffect, useRef } from 'react';

// ! THINGS TO DO 
// ! evaluate need to split up currencyData state object into smaller state objects,
//  ! and see if this impacts Fetch in useEffect
// ! reevaluate my need for keeping track of indices for focus control re select boxes vs filter field
// ! reevaluate the need for gotofilter and focusinselect and their implementation
// ! reevaluate the usage of useEffect and implementation
// ! reevaluate how many times I am calling setCurrecyData and where
// ! rename functions and variables appropriately, evaluate 


// url and app_id for exchangerates provider, to be utilized in fetchAll method.
const FetchConstants = {
     baseURL: 'https://openexchangerates.org/api/',
     app_id: '0f6288f8f4b4421ba1a18cf74a5b9dcf'
}

// limit on maximum num of comparison currencies, to compare with base currency, dictates the quantity of charts which will display and 
// other UI behavior signaling to user such as the threshhold at which flash message alerts user that no further currencies can be 
// added to comparisons list without removing one or more
const MaxNumOfComparisons = 7;

function App() {
    // useRef is utilized solely to ease the control of shifts of focus from filter fields to select boxes, primarily for the implementation
    // of the capability to navigate via arrowDown from filter input to select, or via arrowUp from select box to filter input
    const Refs = {
        baseFilter: useRef(null),
        convertFilter: useRef(null),
        baseSelect: useRef(null),
        convertSelect: useRef(null),
    }
  
    // storing of indices as previous values aids the control of visual and functional navigation from index 0 on select lists into filter input (focus in filter input) via onKeyUp condition regarding arrowUp
    const [prevBaseIndex, setPrevBaseIndex] = useState(-1);
    const [prevConvertIndex, setPrevConvertIndex] =useState(-1);

    // all charts have an associated modal element which will be hidden at first, show on mouseclick on chart element, then visible modals will disappear with animation upon mouseleave of the element
    // all of which is triggered by changes in the below state variables.  default state variable value is an array large enough for maximum num comparision currencies + the base value chart which will be displayed along with them
    const [isChartModalDisplayed, setIsChartModalDisplayed] =useState(Array(MaxNumOfComparisons+1).fill(false));
    const [isChartModalAnimatingDisappearance, setIsChartModalAnimatingDisappearance] = useState(Array(MaxNumOfComparisons+1).fill(false));

    // onChange of each select list, value is set appropriately on select element itself.
    const [baseSelectValue,setBaseSelectValue] = useState(undefined);
    const [convertSelectValue,setConvertSelectValue] = useState(undefined);

    // flash message is displayed when user attempts to exceed 1 more than the allowed maximum number of comparison/conversion currency selections.  whether flash is displayed is controlled by boolean value of state variable.
    const [isFlashDisplayed, setIsFlashDisplayed] = useState(false);

    // boolean value stored in isSmallScreen controls the dimension of the charts, i.e. width or height, which is dependant upon screen size, 
    // controlled via useEffect call with isSmallScreen in dependency array as seen below
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    // control filter UI (display of text input) for both base filter and convert/comparisons filter
    const [baseFilterVal, setBaseFilterVal] = useState("");
    const [convertFilterVal, setConvertFilterVal] = useState("");

    // default base currency is convertFrom, default comparisons are the standardized currency abbreviations as strings in convertTo.   These values can be changed via UI.  
    const [currencySelections, setCurrencySelections] = useState({
        convertFrom: 'USD',
        convertTo: ['AED', 'BGN', 'CNY', 'EUR', 'GBP'],
    });

    // currencyInfo rates are pulled from the API, and will be updated via useEffect when convertFrom changes, as rates requested are values relative to the base currency provided by app via the call to the API
    //  fullNames are the full textual names such as United States Dollar to match the abbreviations for currency such as USD.  These names are used in the informative text displayed on mdoals and in tooltips 
    // upon hover over the display of current base and comparison configuration values in the top configuration section of the UI.
    const [currencyInfo, setCurrencyInfo] = useState({
        rates: {},
        fullNames: {},
    });

    // selected API requires 2 separate URLS to get the desired data as above, one for rates, one with the full names, thus 2 fetches which are chained and nested so that ALL info is ready upon first render
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
        // simple utility method to alphabetize string arrays, which sorts what is purposefully a copy of any array passed in, and thus will avoid mutating the original argument
        // utilized to alphabetize the names of selected comparison currencies upon changes, which is then provided as the new value of convertFrom via state
        // on re-renders this allows a continuity of a sensible order of the charts displayed (comparisons only) as well as of the visual display of the current selected comparison currs found in top right config section
        alphabetizeStringArr: (arr)=> {
            let arrayCopy = [...arr].sort();
            return arrayCopy;
        }
    }

    const ChartsUtils = {
        // the charts displayed depend upon inserting the convertFrom value to the left of all other charts
        getChartsCurrencies: ()=>[currencySelections.convertFrom, ...currencySelections.convertTo],
        
        // to avoid duplicated calls per each required chart of calculation of size of chart from the JSX chart creation code, upon which calculated value various different attributes within creation of the charts elements are dependant 
        // the array of currency names from which charts will be made are mapped to an array of objects with the name and the 'size' required for the chart, dependant upon call to getIndividualChartSize(name)
        // the result is then the array that is utilized in JSX for chart element creation
        getChartsCurrenciesWithSize: ()=>ChartsUtils.getChartsCurrencies().map(name=>{
            return {currency: name, size: ChartsUtils.getIndividualChartSize(name)}
        }),
        // the largest float value among selected currency rates will be represented as the largest graph.  e.g. if 7 CNY is largest value among comparisons to 1 USD base, CNY will be largest graph,
        // USD base will be approximate 1/7 its height as a graph, and other currencies will fall whereever is appropriate, less than or more than USD in size but no larger than CNY
        // if 1 unit of USD is larger than all selected comparisons (because they are some decimal portion less than 1), USD will bhe largest
        getMaxUnitsOfChartCurrs: ()=> {
            let max = currencySelections.convertFrom;
            ChartsUtils.getChartsCurrencies().forEach(value=>{
                if (parseFloat(currencyInfo.rates[value]) > parseFloat(currencyInfo.rates[max])) {
                    max = value;
                }
            })
            return max;
        },
        // utilzing the selected currency which has the largest units in comparison to 1 unit of whichever base currency, the size of any chart will be converted to a proporption of 
        // the maximum (i.e. 100% height or width of the charts area display)
        getIndividualChartSize: (value)=> {
            return parseFloat(currencyInfo.rates[value]) / parseFloat(currencyInfo.rates[ChartsUtils.getMaxUnitsOfChartCurrs()]) * 100
        },
        // dependant upon isSmallScreen boolean state variable which will change upon window resize listener to true (small) or false (large) the orientation value will be used in inline style of JSX
        // to change charts to horizontal (width) or vertical(height) accordingly
        getChartsOrientation: ()=> isSmallScreen ? 'width' : 'height',
    
    }

    const FilterHandling = {
        // the value of base filter field input, used as new value in JSX upon changes
        handleBaseFilterChange: (thisFilter)=> { 
            let val = thisFilter.target.value;
            setBaseFilterVal(val);
        },
        // the value of convert/comparison filter field input
        handleConvertFilterChange(thisFilter) {
            let val = thisFilter.target.value;
            setConvertFilterVal(val);
        },
        // control of focus, arrowDown while in base filter field allows use to navigate seamlessly into first index of base select list as if it were all one element
        handleBaseFilterDownArrowToSelect(e) {
            // 40 is arrowDown
            if (e.keyCode === 40){
                Refs.baseSelect.current.focus();
                // manually set index to 0 (first) because otherwise the select element is focused but index is undefined at first,
                // which a consequence that the user is required to use 2 downarrow key hits to get to index 0 instead of 1.
                Refs.baseSelect.current.selectedIndex = 0;
            }
        },
        // control of focus, re arrowDownfrom conversion currencies filter input field to conversion currencieds select list, as above
        handleConvertFilterDownArrowToSelect(e) {
            if (e.keyCode === 40) {
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
         setPrevConvertIndex(ix);
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
