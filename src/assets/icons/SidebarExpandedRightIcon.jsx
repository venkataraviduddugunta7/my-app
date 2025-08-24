import IconWrapper from "./IconWrapper";

const SidebarExpandedRightIcon = ({ color = "#1D2540", ...props }) => {
  return (
    <IconWrapper color={color} {...props}>
      <path
        d="M5.75 3C4.2402 3 3 4.2402 3 5.75V18.25C3 19.7598 4.2402 21 5.75 21H18.25C19.7598 21 21 19.7598 21 18.25V5.75C21 4.2402 19.7598 3 18.25 3H5.75ZM13.2207 4.5V19.5H5.75C5.0518 19.5 4.5 18.9482 4.5 18.25V5.75C4.5 5.0518 5.0518 4.5 5.75 4.5H13.2207Z"
        fill={color}
      />
    </IconWrapper>
  );
};

export default SidebarExpandedRightIcon;
