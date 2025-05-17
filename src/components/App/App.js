import React from "react";
import styled from "styled-components";
import Header from "../Header/Header";
import Scrollbar from "../Scrollbar/Scrollbar";
import { MAX_ETH_ADDRESS } from "../../../lib/constants";
import ETHDisplay from "../ETHDisplay/ETHDisplay";
import SearchWidget from "../SearchWidget/SearchWidget";
import { indexToETH, ethToIndex } from "../../../lib/ethTools";
const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100svh;
  max-height: 100svh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
`;

const HeaderAndContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const Content = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overscroll-behavior: none;
`;

function App() {
  const [virtualPosition, setVirtualPosition] = React.useState(0n);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [targetPosition, setTargetPosition] = React.useState(null);
  const [itemsToShow, setItemsToShow] = React.useState(40);
  const [search, setSearch] = React.useState("");
  const [searchDisplayed, setSearchDisplayed] = React.useState(false);
  const [showFavorites, _setShowFavorites] = React.useState(false);
  const animationRef = React.useRef(null);

  const [favedAddresses, setFavedAddresses] = React.useState(
    localStorage.getItem("favedAddresses")
      ? JSON.parse(localStorage.getItem("favedAddresses"))
      : {}
  );

  const setShowFavorites = React.useCallback(
    (value) => {
      setVirtualPosition(0n);
      _setShowFavorites(value);
    },
    [_setShowFavorites]
  );

  const MAX_POSITION = React.useMemo(() => {
    if (showFavorites) {
      const itemsToShowBig = BigInt(itemsToShow);
      const favedAddressesLength = BigInt(Object.keys(favedAddresses).length);
      if (favedAddressesLength > itemsToShowBig) {
        return favedAddressesLength - itemsToShowBig;
      }
      return 0n;
    } else return MAX_ETH_ADDRESS - BigInt(itemsToShow);
  }, [itemsToShow, showFavorites, favedAddresses]);

  const toggleFavedAddress = (address) => {
    setFavedAddresses((prev) => {
      const prevValue = prev[address] || false;
      const newValue = !prevValue;
      const newFavedAddresses = { ...prev };
      if (newValue) {
        newFavedAddresses[address] = true;
      } else {
        delete newFavedAddresses[address];
      }

      localStorage.setItem("favedAddresses", JSON.stringify(newFavedAddresses));
      return newFavedAddresses;
    });
  };

  const animateToPosition = React.useCallback(
    (targetPos) => {
      setTargetPosition(targetPos);
      setIsAnimating(true);
    },
    [setTargetPosition, setIsAnimating]
  );

  React.useEffect(() => {
    if (isAnimating && targetPosition !== null) {
      const startPosition = virtualPosition;
      const startTime = performance.now();
      const duration = 300;

      const animate = () => {
        // we can't use the currentTime provided by animate because it's not guaranteed
        // to be after startTime!
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentPos =
          startPosition +
          ((targetPosition - startPosition) *
            BigInt(Math.floor(easeProgress * 1000))) /
            1000n;

        setVirtualPosition(currentPos);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setVirtualPosition(targetPosition);
          setIsAnimating(false);
          setTargetPosition(null);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
    // we intentionally want to save off an "old" copy of virtual position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, targetPosition]);

  const displayedAddresses = React.useMemo(() => {
    if (showFavorites) {
      const allAddresses = Object.keys(favedAddresses)
        .map((address) => {
          const index = ethToIndex(address);
          if (index === null) {
            console.error("no index", address);
            return null;
          }
          return {
            index,
            address,
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => {
          const delta = a.index - b.index;
          if (delta < 0n) return -1;
          if (delta > 0n) return 1;
          return 0;
        });
      let startIndex = virtualPosition;
      let endIndex = startIndex + BigInt(itemsToShow);
      if (startIndex > MAX_POSITION) {
        startIndex = MAX_POSITION;
      }
      return allAddresses.slice(Number(startIndex), Number(endIndex));
    }
    return Array.from({ length: itemsToShow }, (_, i) => {
      const index = virtualPosition + BigInt(i);
      if (index < 0n) {
        return null;
      }
      if (index > MAX_ETH_ADDRESS) {
        return null;
      }
      const address = indexToETH(index);
      if (!address) {
        console.error("no address", index);
        return null;
      }
      return { index, address };
    });
  }, [
    virtualPosition,
    itemsToShow,
    showFavorites,
    favedAddresses,
    MAX_POSITION,
  ]);

  return (
    <>
      <SearchWidget
        animateToPosition={animateToPosition}
        virtualPosition={virtualPosition}
        setVirtualPosition={setVirtualPosition}
        search={search}
        setSearch={setSearch}
        searchDisplayed={searchDisplayed}
        setSearchDisplayed={setSearchDisplayed}
        displayedAddresses={displayedAddresses}
        MAX_POSITION={MAX_POSITION}
      />
      <Wrapper>
        <HeaderAndContent>
          <Header />
          <Content>
            <ETHDisplay
              itemsToShow={itemsToShow}
              setItemsToShow={setItemsToShow}
              virtualPosition={virtualPosition}
              setVirtualPosition={setVirtualPosition}
              isAnimating={isAnimating}
              MAX_POSITION={MAX_POSITION}
              animateToPosition={animateToPosition}
              search={search}
              searchDisplayed={searchDisplayed}
              displayedAddresses={displayedAddresses}
            />
          </Content>
        </HeaderAndContent>
        <Scrollbar
          virtualPosition={virtualPosition}
          MAX_POSITION={MAX_POSITION}
          animateToPosition={animateToPosition}
          setVirtualPosition={setVirtualPosition}
          setIsAnimating={setIsAnimating}
        />
      </Wrapper>
    </>
  );
}

export default App;
