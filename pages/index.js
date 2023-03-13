import React from "react";
import dynamic from "next/dynamic";
const { parse } = require("csv-parse");
const axios = require("axios");
import fs from "fs";
import path, { resolve } from "path";
import { useMemo, useState } from "react";

const FIELDS = [
  "image_id",
  "street",
  "citi",
  "n_citi",
  "bed",
  "bath",
  "sqft",
  "price",
  "price_sqft",
  "counts_locations",
  "average_price_price_sqft",
];

const AppWithNoSSR = dynamic(() => import("./App"), {
  ssr: false,
});
//Load the CSV file
const loadFile = async () =>
  new Promise((resolve, reject) => {
    let data = [];
    const fullPath = path.join(__dirname, "../pages");
    console.log(fullPath);
    const filePath = path.join(process.cwd(), "socal2.csv");

    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
        let initialValue = {};
        let object = row.reduce((obj, item, index) => {
          return {
            ...obj,
            [`${FIELDS[index]}`]: item.trim().trim('"'),
          };
        }, initialValue);
        data.push(object);
      })
      .on("end", () => {
        resolve(data);
      });
  });

//Add delay to API requests
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const aggregateData = async (data) => {
  const cityToAggregations = {};
  let promises = [];
  let cities = []; //Keep track of logged cities

  for (let line of data) {
    if (!cities.includes(line["citi"])) {
      cities.push(line["citi"]);
      let params = {
        address: line["citi"],
        key: "AIzaSyBaOiP4FtxmCuuoBBahBB4W6X2M404-WRM",
      };

      //Store promise of API calls
      promises.push(
        axios
          .get("https://maps.googleapis.com/maps/api/geocode/json", {
            params,
          })
          .then((response) => {
            cityToAggregations[line["citi"]] = {
              n_citi: line["n_citi"],
              average_price_price_sqft: line["average_price_price_sqft"],
              latitude: response.data.results[0].geometry.location.lat,
              longitude: response.data.results[0].geometry.location.lng,
            };
            wait(5000);
          })
          .catch((error) => console.log(`YA BROKE ${error}`))
      );
    }
  }

  //Resolve API calls
  return Promise.all(promises).then(() => cityToAggregations);
};

export async function getServerSideProps() {
  let data = await loadFile(); //Table data
  let aggregatedData = await aggregateData(data); //Map data
  return {
    props: { data, aggregatedData },
  };
}

export default function Home({ data, aggregatedData }) {
  const [currentPage, setCurrentPage] = useState(0);

  //Paginate table
  const onPageTurn = (direction) => {
    if (direction == "FORWARD") {
      console.log("HI");
      setCurrentPage((old) => old + 25);
    } else {
      setCurrentPage((old) => (old - 25 >= 0 ? old - 25 : 0));
    }
  };

  const isForwardDisabled = useMemo(() => {
    let future = currentPage + 25;
    return future >= data.length;
  }, [currentPage]);
  const isBackDisabled = useMemo(() => {
    return currentPage == 0;
  }, [currentPage]);

  return (
    <AppWithNoSSR
      data={data.slice(currentPage, currentPage + 25)}
      aggregatedData={aggregatedData}
      turnPage={(direction) => onPageTurn(direction)}
      isForwardDisabled={isForwardDisabled}
      isBackDisabled={isBackDisabled}
    />
  );
}
