require("module-alias/register");
import * as JSZip from "jszip";
import fs = require("fs");
import * as xml2js from "xml2js-es6-promise";
import GridScaler from "./gridscalerts";
import LayoutGenerator from "@generators/layoutgenerator";
import HTMLGenerator from "@generators/htmlgenerator";
import PowerpointElementParser from "./elementparser";
import WriteOutputFile from "@generators/filewriter";

loadZip();
async function loadZip() {
	var zip = new JSZip();
	let data = await getData("../TeluguApp.pptx");
	let zipResult = await zip.loadAsync(data);

	let slideShowAttributes = await parseSlideAttributes(zipResult, "ppt/presentation.xml");
	let slideSizeX = slideShowAttributes["p:presentation"]["p:sldSz"][0]["$"]["cx"];
	let slideSizeY = slideShowAttributes["p:presentation"]["p:sldSz"][0]["$"]["cy"];
	let pptElementParser = new PowerpointElementParser(slideShowAttributes);
	//TO-DO:

	//Parse ppt/presentation.xml and get size
	let scaler = new GridScaler(slideSizeX, slideSizeY, 12);
	let layoutGen = new LayoutGenerator();
	let htmlGen = new HTMLGenerator();
	//Place elements in right position for HTML
	let slideAttributes = await parseSlideAttributes(zipResult, "ppt/slides/slide2.xml");
	let slideElements = slideAttributes["p:sld"]["p:cSld"][0]["p:spTree"][0]["p:sp"];
	for (let element of slideElements) {
		//parse element body
		let pptElement = pptElementParser.getProcessedElement(element);
		console.log(pptElement);
		layoutGen.generateElementCSS(scaler, pptElement);
		htmlGen.addElementToDOM(element.name);
	}

	//Convert PPT shapes

	//Create Output HTML file

	//console.log(htmlGen.getGeneratedHTML())
	WriteOutputFile("abs.css", layoutGen.getCSS("abs"));
	WriteOutputFile("grid.css", layoutGen.getCSS("grid"));
	WriteOutputFile("index.html", htmlGen.getGeneratedHTML());
}
/**
 * Returns a PPT Element Object
 */
function extractElementAttributes() {
	//standardized object model
	return {
		/*  name: "NextLetterButton", //or the name combined
          type: "rect", //any preset types or others such as "images","textboxes","media"
          elementPostion: { //location to place the element
              x: 100000,
              y: 100000
          },
          elementOffsetPosition: {
              cx: 1000000,
              cy: 1000000,
          },
          value: "",
          visualStyle: {
              border: {
                  thickness: 12,
                  color: red,
                  type: dashed,
                  radius: 25,
              },
              fill: {
                  color: blue,
              }
          },
          fontStyle: {
              font: 'Calibri',
              fontSize: '12',
              fontColor: '#FFF'
          },
          links: {
              //wherever or whichever element this might link do
          }*/
	};
}

async function parseSlideAttributes(zipResult, fileName) {
	let presentationSlide = await zipResult.file(fileName).async("string");
	let parsedPresentationSlide = await xml2js(presentationSlide, { trim: true });
	return parsedPresentationSlide;
}

function getData(fileName): Promise<Buffer> {
	return new Promise(function(resolve, reject) {
		fs.readFile(fileName, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	});
}