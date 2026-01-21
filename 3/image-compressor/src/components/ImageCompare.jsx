import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

export default function ImageCompare({ original, compressed }) {
  return (
    <ReactCompareSlider
      itemOne={<ReactCompareSliderImage src={original} alt="Original" />}
      itemTwo={<ReactCompareSliderImage src={compressed} alt="Compressed" />}
    />
  );
}
