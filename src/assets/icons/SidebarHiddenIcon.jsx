import IconWrapper from "./IconWrapper";

const SidebarHiddenIcon = ({ color = "#1D2540", ...props }) => {
  return (
    <IconWrapper color={color} {...props}>
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3 5.75C3 4.2402 4.2402 3 5.75 3H18.25C19.7598 3 21 4.2402 21 5.75V18.25C21 19.7598 19.7598 21 18.25 21H5.75C4.2402 21 3 19.7598 3 18.25V5.75ZM9.29028 4.5H5.75C5.0518 4.5 4.5 5.0518 4.5 5.75V18.25C4.5 18.9482 5.0518 19.5 5.75 19.5H9.29028V4.5ZM10.7791 4.5V19.5H18.25C18.9482 19.5 19.5 18.9482 19.5 18.25V5.75C19.5 5.0518 18.9482 4.5 18.25 4.5H10.7791Z"
        fill={color}
      />
    </IconWrapper>
  );
};

export default SidebarHiddenIcon;
