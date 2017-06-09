import React, { Component } from 'react';
import './App.css';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import PieChart from 'react-svg-piechart';
import ReactTable from 'react-table';
import 'react-table/react-table.css';

import 'react-select/dist/react-select.css';
var Select = require('react-select');

var Boxplot = require('react-boxplot'),
    computeBoxplotStats = require('react-boxplot/dist/stats');


class Product extends Component {
  constructor() {
    super();
    this.state = {
      colorchartdata: [],
      branddata: [],
      pricedata: [],
      priceanalysis: {
        whiskerLow: 0,
        quartile1: 0,
        quartile2: 0,
        quartile3: 0,
        whiskerHigh: 0
      },
      brandavgs: []
    };
  }
  dbLoad = (category) => {
    var chart_color_list = ['#3366CC','#DC3912','#FF9900','#109618','#990099',
                            '#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E',
                            '#316395','#994499','#22AA99','#AAAA11','#6633CC',
                            '#E67300','#8B0707','#329262','#5574A6','#3B3EAC'];
    function createColorChartData(counts) {
      return Object.keys(counts).map((color, _index, _arr) => {
        return {
          label: color,
          value: counts[color],
          color: (color === 'other') ? '#808080' : color
        }
      }).sort((a, b) => (a.value > b.value) ? -1 : 1);
    }
    function createBrandData(counts) {
      return Object.keys(counts).map((brand, index, _arr) => {
        return {
          label: brand,
          value: counts[brand],
          color: chart_color_list[index % 20]
        }
      }).sort((a, b) => (a.value > b.value) ? -1 : 1);
    }
    function processResponseJSON(response) {
      this.setState({
        colorchartdata: createColorChartData(response.analysis.color_counts),
        branddata: createBrandData(response.analysis.brand_counts),
        pricedata: response.analysis.price_array,
        priceanalysis: computeBoxplotStats(response.analysis.price_array),
        brandavgs: response.analysis.brand_averages
      });
    }
    fetch('http://localhost:3001/?category='+category, {mode: 'cors'})
      .then(response => response.json().then(processResponseJSON.bind(this)));
  }
  createBrandAveragesTableData() {
    return Object.keys(this.state.brandavgs).map((brand, _index, _arr) => {
      return {
        'brand': brand,
        'avg': this.state.brandavgs[brand].avg,
        'quantity': this.state.brandavgs[brand].quantity
      }
    }).sort((a, b) => (a.quantity > b.quantity) ? -1 : 1);
  }
  componentDidMount() {
    this.dbLoad('apron');
  }
  render() {
    function priceFormat(num) {
      return '$' + num.toFixed(2).toString();
    }
    return (
      <div className="Product">
        <h2>{this.state.current_keyword}</h2>
        <Tabs>
          <TabList>
            <Tab>Colors</Tab>
            <Tab>Brands</Tab>
            <Tab>Price distribution</Tab>
            <Tab>Price avg by brand</Tab>
          </TabList>
          <TabPanel>
            <div className="PieChart">
              <div className="pie">
                <PieChart data={this.state.colorchartdata} />
              </div>
              <div className="legend">
                {
                  this.state.colorchartdata.map((element, i) => (
                    <div key={i}>
                      <div style={{background: element.color}} className="circle"></div>
                        <span>
                          {element.label} : {element.value}
                        </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="PieChart">
              <div className="pie">
                <PieChart data={this.state.branddata} />
              </div>
              <div className="legend">
                {
                  this.state.branddata.map((element, i) => (
                    <div key={i}>
                      <div style={{background: element.color}} className="circle"></div>
                        <span>
                          {element.label} : {element.value}
                        </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <Boxplot
              width={400}
              height={50}
              orientation="horizontal"
              min={0}
              max={Math.max.apply(Math, this.state.pricedata)}
              stats={this.state.priceanalysis}
            />
            <h4>Minimum, excluding outliers: {priceFormat(this.state.priceanalysis.whiskerLow)}</h4>
            <h4>First quartile: {priceFormat(this.state.priceanalysis.quartile1)}</h4>
            <h4>Median: {priceFormat(this.state.priceanalysis.quartile2)}</h4>
            <h4>Third quartile: {priceFormat(this.state.priceanalysis.quartile3)}</h4>
            <h4>Maximum, excluding outliers: {priceFormat(this.state.priceanalysis.whiskerHigh)}</h4>
          </TabPanel>
          <TabPanel>
            <ReactTable
              data={this.createBrandAveragesTableData()}
              columns={[{Header: 'Brand', accessor: 'brand'},
                        {Header: 'Average price', id: 'avg', accessor: price => priceFormat(price.avg)},
                        {Header: 'Size of dataset', accessor: 'quantity'}]}
            />
          </TabPanel>
        </Tabs>
      </div>
    )
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      current_keyword: 'apron'
    }
    this.dropdown_options = [
        'apron', 'bandanna', 'bathing suit', 'belt', 'bikini', 'boot',
        'bow tie', 'bra', 'bracelet', 'cardigan', 'coat', 'dress', 'earmuffs',
        'earrings', 'fedora', 'flip-flops', 'glasses', 'gloves', 'handbag',
        'hat', 'helmet', 'high heels', 'jacket', 'jeans', 'kimono', 'mittens',
        'necklace', 'overalls', 'pajamas', 'parka', 'pea coat', 'raincoat',
        'sandals', 'scarf', 'shirt', 'shoe', 'shorts', 'skirt', 'sneakers',
        'sock', 'sunglasses', 'sweater', 't-shirt', 'tie', 'tights',
        'turtleneck', 'tuxedo', 'vest', 'wig', 'windbreaker'
    ].map(val => {return {value: val, label: val}});
  }
  onDropdownChange = (val) => {
    this.setState({current_keyword: val.value});
    this.refs.product.dbLoad(val.value);
  }
  render() {
    return (
      <div className="App">
        <h1>E-Commerce Data Viewer</h1>
        <div className="dropdown-container">
          Select a type of clothing:
          <Select
            name='category-dropdown'
            value={this.state.current_keyword}
            options={this.dropdown_options}
            onChange={this.onDropdownChange}
            clearable={false}
          />
        </div>
        <Product ref="product" value={this.state.current_keyword}/>
      </div>
    );
  }
}

export default App;
