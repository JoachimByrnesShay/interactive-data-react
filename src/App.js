import { useState, useEffect, useRef } from 'react';


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

    // state variables for setting classes in JSX which trigger animation of button when pressed to clear charts, and to animate the disappearance of the clearing of all comparison charts
    const [animateClearChartsButton, setAnimateClearChartsButton] = useState(false);
    const [animateClearChartsComparisons, setAnimateClearChartsComparisons] = useState(false);

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
        // set animate of button to true, so that animating class is added to JSX per ternary condition in JSX
        animateClearChartsButton: ()=> setAnimateClearChartsButton(true),
        // reset animate state variable so that animating class is removed from JSX for button
        // set animateClearChartsComparisons to true, which will add appropriate animated class to .ChartContent (main element)
        clearCharts: ()=>{
            setAnimateClearChartsButton(false);
            setAnimateClearChartsComparisons(true);
        },
        // set the last animation variable in the charts clearing process which controlls presence of JSX class to false
        // set convertTo to empty array, which will result in re-rendering the page with no comparisons listed in configuration section and no comparisons charts, 
        finishClearingCharts: ()=>{
            setAnimateClearChartsComparisons(false);
            setCurrencySelections({...currencySelections, convertTo: []})
        }
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
 
        // used as onKeyUp listener on select element for base currency selection, offers control of behavior upon 'enter' press on option (child of select) 
        // as well as upon upArrow when option at index 0 is currently selected with resulting functionality in latter case of navigating up into base filter input field
        baseSelectKeys: (e)=>{
            let ix = e.target.selectedIndex;

            // on Enter key pressed on option in select element, the convertFrom currency will be changed ot the new value, i.e. of option selected upon enter pressed
            if(e.key === 'Enter') {
                 setCurrencySelections({ ...currencySelections, convertFrom: e.target.value })
            } 
            // if the previous recorded baseSelect-index value representes the first option (ix 0) and the upArrow is pressed, move up into the base filter field
            if(prevBaseIndex === 0 && e.keyCode === 38){
                setBaseSelectValue(undefined);
                Refs.baseSelect.current.selectedIndex = -1;
                Refs.baseFilter.current.focus();

            } 
            // otherwise either downArrow or another key has been pressed, default behavior of down arrow is to continue to traverse downward through the options one by one.
            // default behavior of other alpha keys IF the filter field is blank will be to navigate to the next option whose value starts with the letter pressed, otherwise constrained by filter population
            // update prevBaseIndex in all cases. as implemented, since this method as a sole onKeyUp listener is branching between 2 special cases, the above conditional
            // being dependant upon the prevIndex ensures that we navigate upon the sequence of call to listener-> hear move to ix 0 via index 1 with upArrow, call to listener again (a separate occuccrence) -> hear upArrow from index 0, 
            // rather than be dependant upon e.target.selectedIndex && e.keyCode == 38 as the conditional, 
            // which would not provide the desired control for it would have the effect of jumping into filter field in one listen when moving from -1 to 0, i.e., when moving up the list, the user will never sit on index 0 in that case
            setPrevBaseIndex(ix);
        },
        // similar functionality to baseSelectKeys offered for the conversion currencies select list, with additional complexity of that the comparisons list allows for selecting an array of size up to MaxNumOfComparisons,
        // and not only one value.  This array is the value of the state variable currencySelections.convertTo.  "enter" key on comparison/conversion currency option is a selection funcationality which 
        // will either add the selected currency to the selected comparisons which will be displayed as charts vs the selected base currency, or will remove the currency from the conversions list if it 
        // is already present in the list, or will result in displaying a flash warning message if no further comparison currencies can be added unless one or more are deselected due to being at max size for the convertTo array
        convertSelectKeys: (e)=> {
            let ix = e.target.selectedIndex;

            let val = e.target.value;
            // using same methodology as in baseSelectKeys of employing the conversion/comparisons list selected idnex from the last render to modulate the behavior
            if (prevConvertIndex === 0 && e.keyCode === 38) {
                setConvertSelectValue(undefined);
                Refs.convertSelect.current.selectedIndex = -1;
                Refs.convertFilter.current.focus();
            } else if (e.key === 'Enter') {
                let newArr;
                // if the selected currency is already in currencySelections.convertTo, it will be removed by slicing (returning copies) the array around the index of current selection, combining, 
                // using as the updated value via the state setter for currencySelections 
                if (currencySelections.convertTo.includes(val)) {
                    let ixInSelections = currencySelections.convertTo.indexOf(val);
                    let leftArr = currencySelections.convertTo.slice(0, ixInSelections);
                    let rightArr = currencySelections.convertTo.slice(ixInSelections + 1);
                    newArr = [...leftArr, ...rightArr];
                // flash if exceeds allowable num of selections
                } else if (currencySelections.convertTo.length >= MaxNumOfComparisons) {
                    setIsFlashDisplayed(true);
                    return;
                } else {
                    newArr = [...currencySelections.convertTo, val]
                    // the above may need to be alphabetized in order that it appears in an organized fashion in the configuration display of comparison currencies in the top right
                    newArr = GenUtils.alphabetizeStringArr(newArr);
                }
             
                setCurrencySelections({ ...currencySelections, convertTo: newArr})
            }
            // store the current index as the "previous" index for the next call
            setPrevConvertIndex(ix);
        },
        // in addition to selection of currency functionality upon pressing 'Enter' key, it is desirable to have the same functionality upon mouse double-click
        // in the case of base select, as with 'enter', double click with mouse will select a new base currency
        handleOptionClick_base: (optionVal, e)=> {
            // double click, provide new value for currencySelections state variable using setter
            if (e.detail >= 2) {
                setCurrencySelections({ ...currencySelections, convertFrom: optionVal })
            }
        },
        // same as above, again with additional complexity due to we may select multiple items with conversion/comparisons list and we need to be able to slice and remove if 
        // currency selected and then double clicked is already present in the currency comparisions list, then update 
        handleOptionClick_convert(optionVal, e) {
          
            if (e.detail >= 2) {
                let newArr;
                let val = optionVal;
                
                if (currencySelections.convertTo.includes(val)) {

                    let ix = currencySelections.convertTo.indexOf(val);
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
                setCurrencySelections({ ...currencySelections, convertTo: newArr})
            }
        },
    }

    const ModalHandling = {
        // use state variables which correspond via indices to each modal to store boolean values.  These determine the setting (or not) of classes within the JSX for the modal which determine the UI experience of modal
        // in the JSX, technically the index comes from map function returning containers (divs) with modal as grandchildren (divs with p siblings), thus the modal index is really a unit index for a composite construction of div > div > (p + div), in the map context
        showModal: (e,ix)=> { 
            let thisModalDisplay = true;
    
            // insert a falsey value into isChartModalAnimating, as we are showing it not hiding it (no animation on show)
            let resetIsChartModalAnimating = [...isChartModalAnimatingDisappearance.splice(0, ix), !thisModalDisplay, ...isChartModalAnimatingDisappearance.splice(ix+1)];
           
            // represent the current modal display, by inserting a truthy value at the appropriate index.  There will always be only one modal showing at a time as any modal disappears on mouseleave of its container
            let newDisplaySet = [...isChartModalDisplayed.slice(0,ix), thisModalDisplay,...isChartModalDisplayed.slice(ix+1)];
            setIsChartModalAnimatingDisappearance(resetIsChartModalAnimating);
            setIsChartModalDisplayed(newDisplaySet);
        },
        hideModal: (e,ix)=> {
            if (isChartModalDisplayed[ix]) {
                // if we hideModal, we mark modal as no display but is animating, ie. the only animation is the disappearance of the mdoal
                // we use the isChartModalDisplayed and isChartModalAnimatingDisappearance state variables which are arrays of a size == to the max num of comparisions + 1, as the base currency will also be displayed 
                // as a chart to the left of all comparisons.   For each given modal element, the value of isChartModal... and isChartModalAnim... at the ix equal to the corresponding modals ix 
                // determines whether certain classes are set on the JSX for that modal and its container.
                let thisModalDisplayState = false;
                let animating = true;
                let resetIsChartModalAnimating = [...isChartModalAnimatingDisappearance.splice(0, ix), animating, ...isChartModalAnimatingDisappearance.splice(ix+1)];
               
                let newDisplaySet = [...isChartModalDisplayed.slice(0,ix),thisModalDisplayState, ...isChartModalDisplayed.slice(ix+1)];
                setIsChartModalAnimatingDisappearance(resetIsChartModalAnimating);
                setIsChartModalDisplayed(newDisplaySet);
            }
        }
    }


    // call fetch on first render and whenever currencySelections.convertFrom changes (the base currency), as the rates to be retrieved from API for all currencies are relative to the base currency, and therefore will change
    useEffect(fetchAll, [currencySelections.convertFrom]);


    // listen on window for resize.  at less than 950 innerwidth, isSmallScreen will be set to true.  This will be used in JSX in conjunction with ChartsUtils.getChartsOrientation to change the dimension of graph 
    // section to horizontal or vertical depending on the value of isSmallScreen, oonditionally using inline css 'width' or 'height' but not both, along with calculated size of graph element
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


    // by controlling the UI with value of state variable, allow a fadeout effect of flash warning (shown when user tries to exceed max num of allowable selections of comparison currencies)
    useEffect(() => {if (isFlashDisplayed){
      setTimeout(()=>{setIsFlashDisplayed(false)}, 2000);
    }}, [isFlashDisplayed]);


    return (
        // prevent default behavior of refresh of browser page when enter key is pressed in any/all input field, without this, because there are forms/inputs page will 'submit', resulting in a highly visible 
        // and unpleasing refresh of browser page 
        <div className="Page" onKeyDown={(e)=>e.keyCode === 13 ? e.preventDefault() : undefined}>
        <header className="Header">
        <h1 className='Header-title'>Currency Visualization</h1>
            {/* flash warning only shows based upon value of state variable, via class setting */}
            <div className={`Header-flashContainer ${isFlashDisplayed ? "isDisplayed" : ""}`}>
                <p className={'Header-flashMessage'}>SELECT NO MORE THAN {MaxNumOfComparisons} COMPARISONS.<br/>TO DESELECT A SELECTED CHOICE, click it.</p>
            </div>
        </header>
        <section className="Configure">
            <div className="Configure-Base">
                <h2 className='Configure-baseHeading'>Change your base currency from 
                    {/* using data attrib to set a custom tooltip, displaying title of configured baseValue upon hover, using CSS.  the standard title attribute has default styling which cannot be overriden */}
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
                            /* using map, option with text of currency abbreviation will be created for all named currencies, filtered as appropriate by input/filter value */
                            /* value which is set on select element will change via select onChange and be set to selected option, via state */
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
                            id={'Configure-comparisonsFilter'}
                            className={'Configure-comparisonsFilter'}
                            value={convertFilterVal}
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
                            // in the case of filtering the convert/comparisons list, we omit the base currency deliberately, i.e. currencySelections.convertFrom, via the below
                            Object.keys(currencyInfo.fullNames)
                            .filter(curr => (
                                curr.toLowerCase().startsWith(convertFilterVal.toLowerCase()) //
                                && (curr.toLowerCase() !== currencySelections.convertFrom.toLowerCase())
                            ))
                            .map((curr, index) => (
                                // if any option represents a currency that is a selected comparison, i.e. in the list already, it is styled especially via class setting as below
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
            {/* custom tooltips are created using custom data attributes in the below showConfiguration section for both seledcted base and selected comparison values*/}
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
        {/* button can clear charts by using setter on currencySelections.convertFrom to remove all elements, then re-render with no comparison charts */}
            <div className='Configure-clearChartsContainer'>
                <button 
                    onClick={ChartsUtils.animateClearChartsButton} 
                    className={`Configure-clearChartsButton ${animateClearChartsButton ? 'Configure-clearChartsButton--pressed' : ''}`}
                    onAnimationEnd={ChartsUtils.clearCharts}
                >
                    Clear charts + comparisons
                </button>
            </div>
        </section>
        {/* the class added by the below ternary condition animates the disappearance of all comparison charts */}
        <main onAnimationEnd={ChartsUtils.finishClearingCharts} className={`ChartContent ${animateClearChartsComparisons ? 'ChartContent--clearCharts' : ''}`}>
            {
                /* with respect to code in the below mapping, chartInfo assigns to an object on each iteration consiting of 2 key/values, chartInfo.currency and chartInfo.size.   
                    already calculating size saves from what would otherwise be duplicated calculations in the below code */
                /* the baseCurrency chart gets special styling including a label identifying it as 'base currency' */
                /* getChartsOrientation will return either "width" or "height" depending on isSmallScreen value */
                /* for small charts, opt for displaying label text outside of the chart by using bottom attribute (with absolute positioning) */
                /* every modal is represented by an index, matching indices obtained via the current call to map, keeping track of indices with state variables allows independant control of each modal */
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
