import IconWrapper from "./IconWrapper";

const CalenderFilledIcon = ({ color = "#1D2540", ...props }) => {
  return (
    <IconWrapper color={color} {...props}>
      <path
        d="M8.5 1.75C8.5 1.336 8.164 1 7.75 1C7.336 1 7 1.336 7 1.75V3H8.5V1.75ZM17 1.75C17 1.336 16.664 1 16.25 1C15.836 1 15.5 1.336 15.5 1.75V3H17V1.75ZM20.25 3H17V4.25C17 4.664 16.664 5 16.25 5C15.836 5 15.5 4.664 15.5 4.25V3H8.5V4.25C8.5 4.664 8.164 5 7.75 5C7.336 5 7 4.664 7 4.25V3H3.75C3.336 3 3 3.336 3 3.75V8H21V3.75C21 3.336 20.664 3 20.25 3ZM3 20.25C3 20.664 3.336 21 3.75 21H20.25C20.664 21 21 20.664 21 20.25V9.5H3V20.25Z"
        fill={color}
      />
    </IconWrapper>
  );
};

export default CalenderFilledIcon;
