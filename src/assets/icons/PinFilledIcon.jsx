import IconWrapper from "./IconWrapper";

const PinFilledIcon = ({ color = "#1D2540", ...props }) => {
  return (
    <IconWrapper color={color} {...props}>
      <path
        d="M12 2C8.691 2 6 4.691 6 8C6 11.054 8.295 13.577 11.25 13.948V22.25C11.25 22.664 11.586 23 12 23C12.414 23 12.75 22.664 12.75 22.25V13.948C15.705 13.577 18 11.054 18 8C18 4.691 15.309 2 12 2ZM10 7C9.448 7 9 6.552 9 6C9 5.448 9.448 5 10 5C10.552 5 11 5.448 11 6C11 6.552 10.552 7 10 7Z"
        fill={color}
      />
    </IconWrapper>
  );
};

export default PinFilledIcon;
