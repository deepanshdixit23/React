import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

export default function ImageCompare({ before, after }) {
  return (
    <ReactCompareSlider
      style={{ width: "100%", maxWidth: 320 }}
      itemOne={<ReactCompareSliderImage src={before} alt="Before" />}
      itemTwo={<ReactCompareSliderImage src={after} alt="After" />}
    />
  );
}
