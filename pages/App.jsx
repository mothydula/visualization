import React, { useState, useMemo } from "react";
import styled from 'styled-components'
import { useTable, useFilters } from 'react-table'
import { TextSearchFilter } from "./filters";
import { matchSorterFn } from "./sorting";
//import { MapContainer, GeoJSON, Marker, Popup } from 'react-leaflet'
import countries from './countries.json';
import ReactGeoJSON from "react-geojson";
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';


//Style for app
const Styles = styled.div`
  padding: 1rem;
  max-width: unset;
  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

//Map marker
const markerIcon = new L.Icon({
  iconUrl: 'map-marker-icon.png',
  iconSize: [20, 20],
  iconAnchor: [0, 0],

})

function Table({ columns, data, sortOptions }) {
  const [initialMap, setInitialMap] = useState()

  const defaultColumn = React.useMemo(
    () => ({

      Filter: ""
    }),
    []
  );
  const filterTypes = React.useMemo(
    () => ({
      rankedMatchSorter: matchSorterFn
    }),
    []
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    columns,
    data,
    sortOptions,
    defaultColumn,
    filterTypes
  }, useFilters)

  return (
    <>
      <table {...getTableProps()} style={{ tableLayout: "fixed", maxWidth: "80vw" }}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}
                  {/* Render the columns filter UI */}
                  <div>{column.canFilter ? column.render("Filter") : null}</div></th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}><div>{cell.render('Cell')}</div></td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

const App = ({ data, aggregatedData, turnPage, isForwardDisabled, isBackDisabled }) => {
  if (typeof window !== undefined) {

  }
  const MapContainer = dynamic(() => import('react-leaflet').then((module) => module.MapContainer), {
    ssr: false,
  });
  const GeoJSON = dynamic(() => import('react-leaflet').then((module) => module.GeoJSON), {
    ssr: false,
  });
  const Marker = dynamic(() => import('react-leaflet').then((module) => module.Marker), {
    ssr: false,
  });
  const Popup = dynamic(() => import('react-leaflet').then((module) => module.Popup), {
    ssr: false,
  });
  const columns = useMemo(() => [
    {
      Header: "Southern California Homes",
      columns: [
        {
          Header: "average_price_price_sqft",
          accessor: "average_price_price_sqft",
        },
        {
          Header: "bath",
          accessor: "bath",
          Filter: TextSearchFilter,

        },
        {
          Header: "bed",
          accessor: "bed",
          Filter: TextSearchFilter,
          filter: "rankedMatchSorter",
        },
        {
          Header: "citi",
          accessor: "citi",
          Filter: TextSearchFilter,

        },
        {
          Header: "n_citi",
          accessor: "n_citi",
          Filter: TextSearchFilter,

        },
        {
          Header: "image_id",
          accessor: "image_id",
          Filter: TextSearchFilter,

        },
        {
          Header: "price",
          accessor: "price",
          Filter: TextSearchFilter,

        },
        {
          Header: "price_sqft",
          accessor: "price_sqft",
          Filter: TextSearchFilter,

        },
        {
          Header: "sqft",
          accessor: "sqft",
          Filter: TextSearchFilter,

        },
        {
          Header: "street",
          accessor: "street",
          Filter: TextSearchFilter,
        },
      ],
    },
  ]);

  if (typeof window === 'undefined') {
    return <div>LOADING</div>
  }

  return (typeof window !== undefined ? (<Styles>
    <MapContainer style={{ height: "45vh", width: "75vw" }} zoom={7} center={[34.9582, -116.4194]}>
      <GeoJSON data={countries.features} />
      {Object.keys(aggregatedData).map((key) =>
        <Marker position={[aggregatedData[key].latitude, aggregatedData[key].longitude]} icon={markerIcon}>
          <Popup>
            <b>{key}</b>
            <p>{`n_citi: ${aggregatedData[key].n_citi}`}</p>
            <p>{`avg_price_per_sqft: ${aggregatedData[key].average_price_price_sqft}`}</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
    <Table columns={columns} data={data} sortOptions={[{ id: "average_price_price_sqft", desc: false }, { id: "bath", desc: false }]} />
    <button disabled={isBackDisabled} onClick={() => turnPage("BACK")}>PREV PAGE</button>
    <button disabled={isForwardDisabled} onClick={() => turnPage("FORWARD")}>NEXT PAGE</button>
  </Styles>) : null);
};

export default App;
