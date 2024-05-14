import "./index.css";
import bg from "./assets/blur06.jpg";
// import dummyFish from "./assets/blur09.jpg";
import { useEffect, useRef, useState } from "react";
import { FileInput, Label } from "flowbite-react";
import axios from "axios";

function App() {
  const [tab, setTab] = useState("Fish Prediction");
  const heightRef = useRef<any>(null);
  const [height, setHeight] = useState<number>(0);
  const [fishName, setFishName] = useState<any>({});
  const [fishImage, setFishImage] = useState<any>(null);
  const [enablePredictFish, setEnablePredictFish] = useState<boolean>(false);
  const [predictFishPayload, setPredictFishPayload] = useState<any>({
    ammonia: "",
    nitrite: "",
    nitrate: "",
    temperature: "",
    humidity: "",
    ph: "",
    rainfall: "",
  });

  const [detectData, setDetectData] = useState<any>("");
  const [diseaseData, setDiseaseData] = useState<any>({});

  useEffect(() => {
    const TopPos = heightRef.current?.getBoundingClientRect().top;
    // const LeftPos = heightRef.current?.getBoundingClientRect().left;
    setHeight(window.innerHeight - TopPos - 20);
    // setWidth(window.innerWidth - LeftPos - 10);
  });

  const [image, setImage] = useState<any>(null);
  const [file, setFile] = useState<any>(null);

  const onImageChange = (event: any) => {
    if (event.target.files && event.target.files[0]) {
      setImage(URL.createObjectURL(event.target.files[0]));
      setFile(event.target.files[0]);
    }
  };

  const onClickDetectDisease = () => {
    const formData = new FormData();
    formData.append("file", file);
    let disease = "";
    axios
      .post("http://127.0.0.1:8000/predict-disease", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        disease = response.data.disease;
        setDetectData(response.data.disease);
        axios
          .get(
            `http://127.0.0.1:8000/predict-treatment/${disease.replace(
              " ",
              "%20"
            )}`
          )
          .then((res: any) => {
            setDiseaseData(res.data);
          });
      })
      .catch((error) => {
        console.error("Upload error:", error.response);
      });
  };

  const onClickPredictFish = () => {
    let temp = false;
    if (
      predictFishPayload.ammonia === "" ||
      predictFishPayload.nitrite === "" ||
      predictFishPayload.nitrate === "" ||
      predictFishPayload.temperature === "" ||
      predictFishPayload.humidity === "" ||
      predictFishPayload.ph === "" ||
      predictFishPayload.rainfall === ""
    ) {
      // setEnablePredictFish(false);\
      temp = false;
    } else {
      // setEnablePredictFish(true);
      temp = true;
    }

    let tempPath = "";

    if (temp) {
      axios
        .post("http://127.0.0.1:8000/predict-fish", predictFishPayload)
        .then((res: any) => {
          setFishName(res.data);
          tempPath = res.data.image;
          axios
            .get("http://127.0.0.1:8000/img", {
              params: {
                path: tempPath,
              },
              responseType: "arraybuffer",
            })
            .then((res: any) => {
              const tempType = tempPath.split(".")[1];
              const imageBlob = new Blob([res.data], {
                type: `image/${tempType}`,
              });
              const imageURL = URL.createObjectURL(imageBlob);
              setFishImage(imageURL);
            })
            .catch((error: any) => {
              console.log(error);
            });
        })
        .catch((error: any) => {
          console.log(error);
        });
    }
  };

  useEffect(() => {
    if (
      predictFishPayload.ammonia === "" ||
      predictFishPayload.nitrite === "" ||
      predictFishPayload.nitrate === "" ||
      predictFishPayload.temperature === "" ||
      predictFishPayload.humidity === "" ||
      predictFishPayload.ph === "" ||
      predictFishPayload.rainfall === ""
    ) {
      setEnablePredictFish(false);
    } else {
      setEnablePredictFish(true);
    }
  }, [predictFishPayload]);

  return (
    <div className="w-screen h-screen">
      <div className="fixed z-0 w-full h-full">
        <img
          src={bg}
          alt=""
          className="object-cover w-full h-full object-center"
        />
      </div>

      <div className="absolute z-10 w-full h-full flex p-5 gap-5">
        {/* sidenav */}
        <div className="w-[250px] h-full rounded-lg shadow-md bg-white/50 text-black">
          <div className="text-lg w-full p-3 rounded-lg bg-white/70 flex justify-center font-bold">
            AquaHealth
          </div>
          <div className="p-3 flex flex-col gap-3">
            <div
              className={`px-3 py-2 ${
                tab === "Fish Prediction"
                  ? "bg-[#062D58] text-white"
                  : "bg-[#FAFAFA] text-black"
              }  transition-all rounded-lg shadow-md cursor-pointer hover:scale-[1.05]`}
              onClick={() => setTab("Fish Prediction")}
            >
              Fish Prediction
            </div>
            <div
              className={`px-3 py-2 ${
                tab === "Disease Detection"
                  ? "bg-[#062D58] text-white"
                  : "bg-[#FAFAFA] text-black"
              }  transition-all rounded-lg shadow-md cursor-pointer hover:scale-[1.05]`}
              onClick={() => setTab("Disease Detection")}
            >
              Disease Detection
            </div>
          </div>
        </div>

        {/* content */}
        <div className="w-full h-full rounded-lg text-black">
          <div className="bg-white/80 px-5 py-3 text-lg font-bold rounded-lg">
            {tab}
          </div>
          <div
            className="flex w-full mt-5 justify-center items-center gap-5"
            ref={heightRef}
            style={{ height: height }}
          >
            {tab === "Fish Prediction" ? (
              <>
                <div className="bg-white/90 rounded-lg w-1/3 h-full flex flex-col gap-2">
                  <div className="px-5 py-1 mt-3">
                    <div className="font-semibold text-sm">
                      Ammonia Concentration
                    </div>
                    <input
                      value={predictFishPayload.ammonia}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            ammonia: event.target.value,
                          };
                        })
                      }
                      type="number"
                      step={0.01}
                      placeholder="Ammonia Concentration"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">
                      Nitrite Concentration
                    </div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.nitrite}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            nitrite: event.target.value,
                          };
                        })
                      }
                      placeholder="Nitrite Concentration"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">
                      Nitrate Concentration
                    </div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.nitrate}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            nitrate: event.target.value,
                          };
                        })
                      }
                      placeholder="Nitrate Concentration"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">Temperature</div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.temperature}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            temperature: event.target.value,
                          };
                        })
                      }
                      placeholder="Temperature"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">
                      Humidity Percentage
                    </div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.humidity}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            humidity: event.target.value,
                          };
                        })
                      }
                      placeholder="Humidity Percentage"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">pH Value</div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.ph}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            ph: event.target.value,
                          };
                        })
                      }
                      placeholder="pH Value"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>
                  <div className="px-5 py-1">
                    <div className="font-semibold text-sm">Rainfall Amount</div>
                    <input
                      type="number"
                      step={0.01}
                      value={predictFishPayload.rainfall}
                      onChange={(event) =>
                        setPredictFishPayload((prevData: any) => {
                          return {
                            ...prevData,
                            rainfall: event.target.value,
                          };
                        })
                      }
                      placeholder="Rainfall Amount"
                      className="w-full bg-[#F9FAFB] p-2 rounded shadow focus:outline-none focus:ring focus:ring-[#062D58]/50"
                    />
                  </div>

                  <div className="px-5 py-1">
                    <button
                      onClick={onClickPredictFish}
                      disabled={!enablePredictFish}
                      className={`w-full hover:scale-[1.05] transition-all flex justify-center items-center gap-5 text-lg p-2 shadow ${
                        !enablePredictFish
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      } bg-[#062D58] text-white rounded`}
                    >
                      Predict
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0 1 15 8.818V3.936Z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg w-2/3 h-full p-5 flex flex-col justify-around">
                  {fishName?.fish && fishName?.fish !== "" ? (
                    <>
                      <div className="p-5 bg-white/80 text-lg font-bold rounded-lg">
                        {fishName?.fish}
                      </div>
                      <img
                        src={fishImage}
                        alt=""
                        className="rounded-lg shadow-md h-[80%] object-cover"
                      />
                    </>
                  ) : (
                    <>
                      <div className="p-5 bg-white/80 text-lg font-bold rounded-lg text-gray-500">
                        Fish name
                      </div>
                      <div className="rounded-lg h-[80%] p-5 bg-white/80 text-lg font-bold rounded-lg text-gray-500">
                        Please provide the following information to predict the
                        type of fish.
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-white/50 rounded-lg w-2/3 h-full p-5 flex flex-col justify-around">
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt=""
                        className="rounded-lg shadow-md h-[80%] object-cover"
                      />
                      <div className="flex justify-center items-center gap-5">
                        <button
                          className="w-full hover:scale-[1.05] transition-all flex justify-center items-center gap-5 text-lg p-2 shadow bg-[#F9FAFB] text-black rounded"
                          onClick={() => {
                            setImage(null);
                            setDetectData("");
                            setDiseaseData({});
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={onClickDetectDisease}
                          className="w-full hover:scale-[1.05] transition-all flex justify-center items-center gap-5 text-lg p-2 shadow bg-[#062D58] text-white rounded"
                        >
                          Detect
                          <span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10.5 3.798v5.02a3 3 0 0 1-.879 2.121l-2.377 2.377a9.845 9.845 0 0 1 5.091 1.013 8.315 8.315 0 0 0 5.713.636l.285-.071-3.954-3.955a3 3 0 0 1-.879-2.121v-5.02a23.614 23.614 0 0 0-3 0Zm4.5.138a.75.75 0 0 0 .093-1.495A24.837 24.837 0 0 0 12 2.25a25.048 25.048 0 0 0-3.093.191A.75.75 0 0 0 9 3.936v4.882a1.5 1.5 0 0 1-.44 1.06l-6.293 6.294c-1.62 1.621-.903 4.475 1.471 4.88 2.686.46 5.447.698 8.262.698 2.816 0 5.576-.239 8.262-.697 2.373-.406 3.092-3.26 1.47-4.881L15.44 9.879A1.5 1.5 0 0 1 15 8.818V3.936Z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <Upload onImageChange={onImageChange} />
                  )}
                </div>
                <div className="bg-white/90 rounded-lg w-1/3 h-full p-5 text-black">
                  {image ? (
                    <>
                      <div className="font-bold text-lg">
                        Fish Health Analysis Results:
                      </div>
                      <div className="flex flex-col gap-5 mt-10 h-[89%]">
                        <div className="p-5 flex flex-col gap-3 border-2 border-[#AC97AB] h-1/3 rounded-lg">
                          <div className="font-bold text-lg">Disease:</div>
                          <div className="">{detectData}</div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 border-2 border-[#AC97AB] h-1/3 rounded-lg rounded-lg">
                          <div className="font-bold text-lg">Medication:</div>
                          <div className="">{diseaseData?.medication}</div>
                        </div>
                        <div className="p-5 flex flex-col gap-3 border-2 border-[#AC97AB] h-1/3 rounded-lg rounded-lg">
                          <div className="font-bold text-lg">Treatment:</div>
                          <div className="">{diseaseData?.treatment}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-full w-full flex justify-center items-center">
                        <div className="text-lg w-[80%]">
                          Please upload an image of the fish to receive disease
                          identification and medication recommendations.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Upload({ onImageChange }: any) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Label
        onChange={onImageChange}
        htmlFor="dropzone-file"
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
      >
        <div className="flex flex-col items-center justify-center pb-6 pt-5">
          <svg
            className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            SVG, PNG, JPG
          </p>
        </div>
        <FileInput id="dropzone-file" className="hidden" />
      </Label>
    </div>
  );
}

export default App;
