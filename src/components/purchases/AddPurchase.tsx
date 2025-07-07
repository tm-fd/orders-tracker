"use client";
import { useCallback, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Checkbox,
  Input,
  Select,
  SelectSection,
  SelectItem,
  Spinner,
} from "@heroui/react";
import axios from "axios";
import cryptoRandomString from "crypto-random-string";
import Joi from "joi";
import { motion, AnimatePresence } from "framer-motion";
import { mutate } from "swr";
import { useSession } from "next-auth/react";
import usePurchaseStore from "@/store/purchaseStore";
import { PlusIcon } from "@/components/icons";

export default function AddPurchase({ currentPage }) {
  const { data: session } = useSession();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [duration, setDuration] = useState("");
  const addPurchase = usePurchaseStore((state) => state.addPurchase);

  const startPackage = [
    {
      key: "84",
      label: "12 weeks",
    },
    {
      key: "30",
      label: "Subscription",
    },
  ];

  const continueTraining = [
    {
      key: "42",
      label: "6 weeks",
    },
    {
      key: "84",
      label: "12 weeks",
    },
    {
      key: "180",
      label: "6 months",
    },
    {
      key: "360",
      label: "12 months",
    },
  ];
  const [email, setEmail] = useState("");
  const [firstName, setFistname] = useState("");
  const [lastName, setLastname] = useState("");
  const [numberOfVrGlasses, setNumberOfVrGlasses] = useState("1");
  const [numberOfLicenses, setNumberOfLicenses] = useState("1");
  const [isSubscription, setIsSubscription] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [createWooCommerceOrder, setCreateWooCommerceOrder] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    phone: "",
  });

  const countries = [
    { key: "SE", label: "Sweden" },
    { key: "NO", label: "Norway" },
    { key: "DK", label: "Danmark" },
    { key: "FI", label: "Finland" },
    { key: "EE", label: "Estonia" },
    { key: "CH", label: "Switzerland" },
    { key: "GB", label: "United Kingdom" },
    { key: "IS", label: "Iceland" },
    { key: "FR", label: "France" },
    { key: "DE", label: "Germany" },
    { key: "AX", label: "Åland Islands" },
  ];

  const handleSelectionChange = (e: any) => {
    setDuration(e.target.value);
  };

  const JoiValidatePurchase = (obj: any) => {
    const baseSchema = {
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: false } })
        .required()
        .trim()
        .messages({
          "string.email": `Email must be valid`,
          "string.required": `Email is required`,
        }),
      firstName: Joi.string().required().messages({
        "string.required": `First Name is required`,
      }),
      lastName: Joi.string().required().messages({
        "string.required": `Last Name is required`,
      }),
      numberOfVrGlasses: Joi.number().min(0).max(1000).required().messages({
        "number.min": `Number of VR glasses must be greater than or equal to 0`,
        "number.required": `Number of VR glasses is required`,
      }),
      numberOfLicenses: Joi.number().min(1).max(1000).required().messages({
        "number.required": `Number of Licenses is required`,
        "number.min": `Number of Licenses must be greater than or equal to 1`,
      }),
      duration: Joi.number().min(1).required().messages({
        "number.min": `Duration is required`,
      }),
      code: Joi.string().required(),
      orderNumber: Joi.string().required(),
      isSubscription: Joi.boolean().required(),
      additionalInfo: Joi.string().allow("").optional(),
      additional_info: Joi.object().allow(null).optional(),
    };

    const schema = Joi.object(baseSchema);
    return schema.validate(obj);
  };

  const validateShippingAddress = (shippingAddress: any) => {
    const shippingAddressSchema = Joi.object({
      address1: Joi.string().required().messages({
        "string.empty": "Address Line 1 is required",
        "any.required": "Address Line 1 is required",
      }),
      address2: Joi.string().allow("").optional(),
      city: Joi.string().required().messages({
        "string.empty": "City is required",
        "any.required": "City is required",
      }),
      state: Joi.string().allow("").optional().messages({
        "string.empty": "State is required",
        "any.required": "State is required",
      }),
      postcode: Joi.string().required().messages({}),
      country: Joi.string().required().messages({
        "string.empty": "Country is required",
        "any.required": "Country is required",
      }),
      phone: Joi.string()
      .pattern(/^(\+?[1-9]\d{1,14}|0\d{9})$/)
      .allow("") 
      .optional()
      .messages({
        "string.pattern.base": "Please enter a valid phone number",
      }),
    });

    return shippingAddressSchema.validate(shippingAddress, {
      abortEarly: false,
    });
  };

  const getLastOrderId = async () => {
    try {
      const response = await axios.get(
        `${process.env.IMVI_WOOCOMMERCE_URL}/wp-json/wc/v3/orders`,
        {
          params: {
            per_page: 1,
            orderby: "date",
            order: "desc",
          },
          auth: {
            username: process.env.WOO_API_KEY,
            password: process.env.WOO_API_SECERT,
          },
        }
      );

      if (response.data && response.data.length > 0) {
        return String(response.data[0].id + 1);
      }
      return null;
    } catch (error) {
      console.error("Error fetching last order ID:", error);
      return null;
    }
  };

  const submitPurchase = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    if (createWooCommerceOrder) {
      const { error: shippingError } = validateShippingAddress(shippingAddress);
      if (shippingError) {
        const errorMessage = shippingError.details
          .map((detail) => detail.message)
          .join(", ");
        setErrorMessage(errorMessage);
        setLoading(false);
        return;
      }
    }

    const orderNumber = cryptoRandomString({ length: 10, type: "numeric" });
    const code = cryptoRandomString({
      length: 4,
      characters: "2346789abcdefghjkmnpqrtuvwxyzABCDEFGHJKMNPQRTUVWXYZ",
    });

    const purchaseType = isSubscription
      ? "SUBSCRIPTION"
      : Number(duration) === 42 ||
        Number(duration) === 180 ||
        Number(duration) === 360 ||
        (Number(duration) === 84 && Number(numberOfVrGlasses) === 0)
      ? "CONTINUE_TRAINING"
      : "START_PACKAGE";


    const initPurchaseObj = {
      email,
      firstName,
      lastName,
      code,
      numberOfVrGlasses: numberOfVrGlasses ? Number(numberOfVrGlasses) : -1,
      numberOfLicenses: Number(numberOfLicenses),
      isSubscription,
      duration: Number(duration),
      orderNumber,
      additional_info: {
        info: additionalInfo,
        purchase_source: "ADMIN",
        purchase_type: purchaseType,
      },
    };

    const { error } = JoiValidatePurchase(initPurchaseObj);
    if (error) {
      setErrorMessage(error.details[0].message);
      setLoading(false);
      return;
    }

    const orderNumberFromWoo = createWooCommerceOrder
      ? await getLastOrderId()
      : orderNumber;
    const purchaseObj = {
      ...initPurchaseObj,
      orderNumber: orderNumberFromWoo,
    };
    try {
      const purchaseRes = await axios.post(
        `${process.env.CLOUDRUN_DEV_URL}/purchases/addPurchase`,
        purchaseObj,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.sessionToken}`,
          },
        }
      );

      if (purchaseRes.status === 200) {
        const purchaseId = purchaseRes.data.id;
        // If WooCommerce order creation is enabled, create the order
        if (createWooCommerceOrder) {
          try {
            const wooCommerceOrderData = {
              payment_method: "bacs",
              payment_method_title: "Unknown Payment Transfer",
              set_paid: true,
              status: "processing",
              billing: {
                first_name: firstName,
                last_name: lastName,
                address_1: shippingAddress.address1,
                address_2: shippingAddress.address2 || "",
                city: shippingAddress.city,
                state: shippingAddress.state,
                postcode: shippingAddress.postcode,
                country: shippingAddress.country,
                email: email,
                phone: shippingAddress.phone,
              },
              shipping: {
                first_name: firstName,
                last_name: lastName,
                address_1: shippingAddress.address1,
                address_2: shippingAddress.address2 || "",
                city: shippingAddress.city,
                state: shippingAddress.state,
                postcode: shippingAddress.postcode,
                country: shippingAddress.country,
              },
              line_items: [
                {
                  product_id: process.env.VR_GLASSES_PRODUCT_ID,
                  quantity: Number(numberOfVrGlasses) || 0,
                  total: couponCode.trim() === "" ? "0" : undefined,
                },
                {
                  product_id: process.env.LICENSE_PRODUCT_ID,
                  quantity: Number(numberOfLicenses),
                  total: couponCode.trim() === "" ? "0" : undefined,
                },
              ],
              shipping_lines: [
                {
                  method_id: "flat_rate",
                  method_title: "Flat Rate",
                  total: "0.00",
                },
              ],
              meta_data: [
                {
                  key: "_activation_code",
                  value: code,
                },
                {
                  key: "_created_from_dashboard",
                  value: "true",
                },
              ],
              coupon_lines: couponCode ? [{ code: couponCode.toLocaleLowerCase() }] : [],
            };

            // Remove line items with quantity 0
            wooCommerceOrderData.line_items =
              wooCommerceOrderData.line_items.filter(
                (item) => item.quantity > 0
              );

            const wooCommerceRes = await axios.post(
              `${process.env.IMVI_WOOCOMMERCE_URL}/wp-json/wc/v3/orders`,
              wooCommerceOrderData,
              {
                auth: {
                  username: process.env.WOO_API_KEY,
                  password: process.env.WOO_API_SECERT,
                },
              }
            );
            console.log(wooCommerceRes);
            if (
              wooCommerceRes.status !== 200 &&
              wooCommerceRes.status !== 201
            ) {
              throw new Error("Failed to create WooCommerce order");
            }
          } catch (wooCommerceError) {
            console.error(
              "Error creating WooCommerce order:",
              wooCommerceError
            );
            setErrorMessage(
              "Purchase added, but failed to create WooCommerce order. Please try creating the order manually."
            );
            setLoading(false);
            return;
          }
        }
        // Handle additional info if present
        if (additionalInfo) {
          try {
            const additionalInfoRes = await axios.post(
              `${process.env.CLOUDRUN_DEV_URL}/purchases/additional-info/${purchaseId}`,
              {
                info: additionalInfo,
                purchase_source: "ADMIN",
                purchase_type: purchaseType,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.user?.sessionToken}`,
                },
              }
            );

            if (
              additionalInfoRes.status !== 200 &&
              additionalInfoRes.status !== 201
            ) {
              throw new Error("Failed to add additional info");
            }
          } catch (additionalInfoError) {
            console.error("Error adding additional info:", additionalInfoError);
            setErrorMessage(
              "Purchase added, but failed to add additional info. Please try updating the purchase later."
            );
            setLoading(false);
            return;
          }
        }
        addPurchase({
          id: purchaseId,
          orderNumber: createWooCommerceOrder
            ? orderNumberFromWoo
            : orderNumber,
          email,
          customerName: firstName + " " + lastName,
          date: purchaseRes.data.created_at,
          updatedDate: purchaseRes.data.updated_at,
          confirmationCode: code,
          numberOfVrGlasses: Number(numberOfLicenses),
          numberOfLicenses: Number(numberOfLicenses),
          isSubscription: isSubscription,
          duration: Number(duration),
          additionalInfo: [
            {
              info: additionalInfo,
              purchase_source: "ADMIN",
              purchase_type: purchaseType,
            },
          ],
        });

        // Then mutate SWR cache
        mutate([
          "/purchases",
          {
            limit: 370,
            page: currentPage,
          },
        ]);

        setLoading(false);
        setIsSubmitted(true);
        setErrorMessage("The purchase has been added successfully");

        // Clear all form fields
        setEmail("");
        setFistname("");
        setLastname("");
        setNumberOfVrGlasses("");
        setNumberOfLicenses("");
        setIsSubscription(false);
        setDuration("");
        setAdditionalInfo("");
        setCreateWooCommerceOrder(false);
        setShippingAddress({
          address1: "",
          address2: "",
          city: "",
          state: "",
          postcode: "",
          country: "",
          phone: "",
        });

        setTimeout(() => {
          setErrorMessage(null);
          setIsSubmitted(false);
        }, 4000);
      } else {
        throw new Error(
          `Error: Something went wrong, response status code ${purchaseRes.status}`
        );
      }
    } catch (error) {
      setLoading(false);
      if (error.response) {
        setErrorMessage(
          `Error: ${error.response.data.message || "Server error"}`
        );
      } else if (error.request) {
        setErrorMessage(
          "Error: No response from server. Please check your internet connection."
        );
      } else {
        setErrorMessage(`Error: ${error.message}`);
      }
    }
  }, [
    email,
    firstName,
    lastName,
    numberOfVrGlasses,
    numberOfLicenses,
    isSubscription,
    duration,
    additionalInfo,
    createWooCommerceOrder,
    shippingAddress,
    mutate,
    currentPage,
    couponCode,
  ]);

  const handleInputChange = (e) => {
    setErrorMessage(null);
  };

  return (
    <>
      <Button
        size="lg"
        onPress={onOpen}
        className="bg-blue-700"
        endContent={<PlusIcon />}
      >
        Add Purchase
      </Button>
      {loading && (
        <Modal
          backdrop="blur"
          isOpen={isOpen}
          onClose={onClose}
          placement="top-center"
          classNames={{ closeButton: "hidden" }}
          className="bg-transparent shadow-none"
          isDismissable={false}
          shadow="sm"
          isKeyboardDismissDisabled={true}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalBody className="flex flex-col h-20">
                  <Spinner size="lg" color="secondary" />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
      <Modal
        size="lg"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <div className="h-20">
                <AnimatePresence initial={false} mode="wait">
                  {errorMessage && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 50, scale: 0.3 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.5,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <ModalHeader
                        className={`flex flex-col gap-1 !p-3 ${
                          isSubmitted
                            ? "bg-green-500 text-green-50"
                            : "bg-warning-100 text-warning-700"
                        }`}
                      >
                        {errorMessage}
                      </ModalHeader>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ModalBody className="pt-5">
                <Input
                  autoFocus
                  label="Email"
                  variant="bordered"
                  errorMessage="Please enter a valid email"
                  value={email}
                  onValueChange={setEmail}
                  isRequired
                />
                <Input
                  autoFocus
                  label="First name"
                  variant="bordered"
                  value={firstName}
                  onValueChange={setFistname}
                  isRequired
                />
                <Input
                  autoFocus
                  label="Last name"
                  variant="bordered"
                  value={lastName}
                  onValueChange={setLastname}
                  isRequired
                />
                <Input
                  autoFocus
                  label="Number of VR glasses"
                  variant="bordered"
                  value={numberOfVrGlasses}
                  onValueChange={setNumberOfVrGlasses}
                  type="number"
                  isRequired
                />
                <Input
                  autoFocus
                  label="Number of Licenses"
                  variant="bordered"
                  value={numberOfLicenses}
                  onValueChange={setNumberOfLicenses}
                  onChange={handleInputChange}
                  type="number"
                  isRequired
                />
                <Input
                  autoFocus
                  label="Additional Info"
                  variant="bordered"
                  value={additionalInfo}
                  onValueChange={setAdditionalInfo}
                  onChange={handleInputChange}
                />
                <Checkbox
                  autoFocus
                  isSelected={isSubscription}
                  onValueChange={setIsSubscription}
                  color="secondary"
                >
                  Is Subscription
                </Checkbox>
                <Select
                  label="Duration"
                  placeholder="Select an duration"
                  defaultSelectedKeys={["84"]}
                  selectedKeys={[duration]}
                  onChange={handleSelectionChange}
                  className="max-w-xs"
                  isRequired
                >
                  <SelectSection showDivider title="Start Package">
                    {startPackage.map((d) => (
                      <SelectItem key={d.key}>{d.label}</SelectItem>
                    ))}
                  </SelectSection>
                  <SelectSection title="Continue Training">
                    {continueTraining.map((d) => (
                      <SelectItem key={d.key}>{d.label}</SelectItem>
                    ))}
                  </SelectSection>
                </Select>
                <Checkbox
                  autoFocus
                  isSelected={createWooCommerceOrder}
                  onValueChange={setCreateWooCommerceOrder}
                  color="secondary"
                >
                  Create WooCommerce Order
                </Checkbox>

                {/* Shipping Address Form - only shown when createWooCommerceOrder is true */}
                {createWooCommerceOrder && (
                  <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold">Discount</h3>
                    <Input
                      label="Coupon Code"
                      variant="bordered"
                      value={couponCode}
                      onValueChange={setCouponCode}
                      description="Enter coupon code which has been created in woocommerce"
                    />
                    <h3 className="text-lg font-semibold">Shipping Address</h3>
                    <Input
                      autoFocus
                      label="Address Line 1"
                      variant="bordered"
                      value={shippingAddress.address1}
                      onValueChange={(value) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          address1: value,
                        }))
                      }
                      isRequired
                    />
                    <Input
                      label="Address Line 2"
                      variant="bordered"
                      value={shippingAddress.address2}
                      onValueChange={(value) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          address2: value,
                        }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        variant="bordered"
                        value={shippingAddress.city}
                        onValueChange={(value) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            city: value,
                          }))
                        }
                        isRequired
                      />
                      <Input
                        label="State/Province"
                        variant="bordered"
                        value={shippingAddress.state}
                        onValueChange={(value) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            state: value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Postal Code"
                        variant="bordered"
                        value={shippingAddress.postcode}
                        onValueChange={(value) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            postcode: value,
                          }))
                        }
                        isRequired
                      />
                      <Select
                        label="Country"
                        variant="bordered"
                        selectedKeys={[shippingAddress.country]}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        isRequired
                      >
                        {countries.map((country) => (
                          <SelectItem key={country.key} value={country.key}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Input
                      label="Phone"
                      variant="bordered"
                      value={shippingAddress.phone}
                      onValueChange={(value) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          phone: value,
                        }))
                      }
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  className="bg-blue-700"
                  onPress={submitPurchase}
                  isDisabled={loading}
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
